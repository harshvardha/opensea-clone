const { expect } = require("chai")

const toWei = (num) => ethers.utils.parseEther(num.toString())
const fromWei = (num) => ethers.utils.formatEther(num)

describe("NFTMarketPlace", function () {
    let deployer, addr1, addr2, nft, marketPlace
    let feePercent = 1
    let URI = "Sample URI"
    beforeEach(async function () {
        //get contract factories
        const NFT = await ethers.getContractFactory("NFT")
        const MarketPlace = await ethers.getContractFactory("MarketPlace")
        //get signers
        let [dep, address1, address2] = await ethers.getSigners()
        deployer = dep
        addr1 = address1
        addr2 = address2
        //deploy contracts
        nft = await NFT.deploy()
        marketPlace = await MarketPlace.deploy(feePercent)
    })

    describe("Deployment", function () {
        it("Should track name and symbol of nft collection", async function () {
            expect(await nft.name()).to.equal("DApp NFT")
            expect(await nft.symbol()).to.equal("DAPP")
        })
        it("Should track feeAccount and feePercent of the marketPlace", async function () {
            expect(await marketPlace.feeAccount()).to.equal(deployer.address)
            expect(await marketPlace.feePercent()).to.equal(feePercent)
        })
    })

    describe("Minting NFTs", function () {
        it("Should track each mined NFT", async function () {
            //addr1 mints an nft
            await nft.connect(addr1).mint(URI)
            expect(await nft.tokenCount()).to.equal(1)
            expect(await nft.balanceOf(addr1.address)).to.equal(1)
            expect(await nft.tokenURI(1)).to.equal(URI)
            //addr2 mints an nft
            await nft.connect(addr2).mint(URI)
            expect(await nft.tokenCount()).to.equal(2)
            expect(await nft.balanceOf(addr2.address)).to.equal(1)
            expect(await nft.tokenURI(2)).to.equal(URI)
        })
    })

    describe("Making marketplace items", function () {
        beforeEach(async function () {
            // addr1 mints an nft
            await nft.connect(addr1).mint(URI)
            // addr1 approves marketplace to spend nft
            await nft.connect(addr1).setApprovalForAll(marketPlace.address, true)
        })

        it("Should track newly created item, transfer NFT from seller to marketplace and emit Offered event", async function () {
            // addr1 offers their nft at a price of 1 ether
            await expect(marketPlace.connect(addr1).makeItem(nft.address, 1, toWei(1)))
                .to.emit(marketPlace, "Offered")
                .withArgs(
                    1,
                    nft.address,
                    1,
                    toWei(1),
                    addr1.address
                )
            //Owner of NFT should now be the marketplace
            expect(await nft.ownerOf(1)).to.equal(marketPlace.address)
            //Item Count should now be 1
            expect(await marketPlace.itemCount()).to.equal(1)
            //Get item from items mapping the check fields to ensure they are correct
            const item = await marketPlace.items(1)
            expect(item.itemId).to.equal(1)
            expect(item.nft).to.equal(nft.address)
            expect(item.tokenId).to.equal(1)
            expect(item.price).to.equal(toWei(1))
            expect(item.sold).to.equal(false)
        })

        it("Should fail if price is set to zero", async function () {
            await expect(
                marketPlace.connect(addr1).makeItem(nft.address, 1, 0)
            ).to.be.revertedWith("Price must be greater than zero")
        })
    })

    describe("Purchasing marketplace items", function () {
        let price = 2
        beforeEach(async function () {
            // addr1 mints an nft
            await nft.connect(addr1).mint(URI)
            // addr1 approves marketplace to spend nft
            await nft.connect(addr1).setApprovalForAll(marketPlace.address, true)
            // addr1 makes their nft a marketplace item
            await marketPlace.connect(addr1).makeItem(nft.address, 1, toWei(price))
        })

        it("Should update item as sold, pay seller, transfer NFT to buyer, charge fees and emit a Bought event", async function () {
            const sellerInitialEthBal = await addr1.getBalance()
            const feeAccountInitialEthBal = await deployer.getBalance()
            console.log(sellerInitialEthBal)
            console.log(feeAccountInitialEthBal)
            // fetch items total price (marketFees + itemPrice)
            let totalPriceInWei = await marketPlace.getTotalPrice(1)
            // addr2 purchases the item
            await expect(marketPlace.connect(addr2).purchaseItem(1, { value: totalPriceInWei }))
                .to.emit(marketPlace, "Bought")
                .withArgs(
                    1,
                    nft.address,
                    1,
                    toWei(price),
                    addr1.address,
                    addr2.address
                )
            const sellerFinalEthBal = await addr1.getBalance()
            const feeAccountFinalEthBal = await deployer.getBalance()
            console.log(sellerFinalEthBal)
            console.log(feeAccountFinalEthBal)
            // seller should recieve payment for the price of the NFT sold
            expect(+fromWei(sellerFinalEthBal)).to.equal(price + +fromWei(sellerInitialEthBal))
            // calculate fee
            const fee = (feePercent / 100) * price
            // feeAccount should recieve fee
            expect(+fromWei(feeAccountFinalEthBal)).to.equal(+fee + +fromWei(feeAccountInitialEthBal))
            // The buyer should now own the nft
            expect(await nft.ownerOf(1)).to.equal(addr2.address)
            // Item should be marked as sold
            expect((await marketPlace.items(1)).sold).to.equal(true)
        })

        it("Should fail for invalid item ids, sold items and when not enough eth is paid", async function () {
            const totalPriceInWei = await marketPlace.getTotalPrice(1)
            // fails for invalid item ids
            await expect(
                marketPlace.connect(addr2).purchaseItem(2, { value: totalPriceInWei })
            ).to.be.revertedWith("item doesn't exist")
            await expect(
                marketPlace.connect(addr2).purchaseItem(0, { value: totalPriceInWei })
            ).to.be.revertedWith("item doesn't exist")
            // fails when not enough ether is paid with the transaction
            await expect(
                marketPlace.connect(addr2).purchaseItem(1, { value: toWei(price) })
            ).to.be.revertedWith("not enough ether to cover the item price and market fee")
            // addr2 purchases item 1
            await marketPlace.connect(addr2).purchaseItem(1, { value: totalPriceInWei })
            // deployer tries to purchase already sold item 1
            await expect(
                marketPlace.connect(deployer).purchaseItem(1, { value: totalPriceInWei })
            ).to.be.revertedWith("item already sold")
        })
    })
})