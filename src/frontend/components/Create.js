import { useState } from "react";
import { ethers } from "ethers";
import { Row, Form, Button } from "react-bootstrap"
import { create as ipfsHttpClient } from "ipfs-http-client"
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

const Create = ({ marketPlace, nft }) => {
    const [image, setImage] = useState('')
    const [price, setPrice] = useState(null)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')

    const uploadToIPFS = async (event) => {
        event.preventDefault()
        const file = event.target.files[0]
        if (typeof file !== 'undefined') {
            try {
                const result = await client.add(file)
                setImage(`https://ipfs.infura.io/ipfs/${result.path}`)
            } catch (error) {
                console.log("ipfs image upload error: ", error)
            }
        }
    }

    const createNFT = async () => {
        if (!image || !price || !name || !description) return
        try {
            const result = await client.add(JSON.stringify({ image, name, description }))
            mintThenList(result)
        } catch (error) {
            console.log("ipfs uri upload error: ", error)
        }
    }

    const mintThenList = async (result) => {
        const uri = `https://ipfs.infura.io/ipfs/${result.path}`
        // mint nft
        await (await nft.mint(uri)).wait()
        // get tokenId of new nft
        const id = await nft.tokenCount()
        // approve marketplace to spend nft
        await (await nft.setApprovalForAll(marketPlace.address, true)).wait()
        // add nft to marketplace
        const listingPrice = ethers.utils.parseEther(price.toString())
        await (await marketPlace.makeItem(nft.address, id, listingPrice)).wait()
    }

    return (
        <div className="constainer-fluid mt-5">
            <div className="row">
                <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
                    <div className="content mx-auto">
                        <Row className="g-4">
                            <Form.Control
                                type="file"
                                required
                                name="file"
                                onChange={uploadToIPFS}
                            />
                            <Form.Control
                                onChange={(event) => setName(event.target.value)}
                                size="lg"
                                type="text"
                                required
                                placeholder="Name"
                            />
                            <Form.Control
                                onChange={(event) => setDescription(event.target.value)}
                                size="lg"
                                as="textarea"
                                required
                                placeholder="Description"
                            />
                            <Form.Control
                                onChange={(event) => setPrice(event.target.value)}
                                size="lg"
                                type="number"
                                required
                                placeholder="Price in ETH"
                            />
                            <div className="d-grid px-0">
                                <Button onClick={createNFT} variant="primary" size="lg">
                                    Create & List NFT!
                                </Button>
                            </div>
                        </Row>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Create