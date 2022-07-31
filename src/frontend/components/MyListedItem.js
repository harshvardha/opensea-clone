import { useState } from "react";
import { ethers } from "ethers";
import { Row, Col, Card } from "react-bootstrap"
import { useEffect } from "react";

const renderSoldItems = (items) => {
    return (
        <>
            <h2>Sold</h2>
            <Row xs={1} md={2} lg={4} className="g-4 py-3">
                {items.map((item, index) => {
                    <Col key={index} className="overflow-hidden">
                        <Card>
                            <Card.Img variant="top" src={item.image} />
                            <Card.Footer>
                                For {ethers.utils.formatEther(item.totalPrice)} ETH - Recieved {ethers.utils.formatEther(item.price)} ETH
                            </Card.Footer>
                        </Card>
                    </Col>
                })}
            </Row>
        </>
    )
}

export default function MyListedItem({ marketPlace, nft, account }) {
    const [loading, setLoading] = useState(true)
    const [listedItems, setListedItems] = useState([])
    const [soldItems, setSoldItems] = useState([])
    const loadListedItems = async () => {
        // Load all sold items that the user listed
        const itemCount = await marketPlace.itemCount()
        let listedItems = []
        let soldItems = []
        for (let i = 0; i < itemCount; i++) {
            const item = await marketPlace.items(i)
            if (item.seller.toLowerCase() === account) {
                // get uri url from nft contract
                const uri = await nft.tokenURI(item.tokenId)
                // use uri to fetch the nft metadata stored on ipfs
                const response = await fetch(uri)
                const metadata = response.json()
                // get total price of item (itemprice +  fee)
                const totalPrice = await marketPlace.getTotalPrice(item.itemId)
                // define listed item object
                let item = {
                    totalPrice,
                    price: item.price,
                    itemId: item.itemId,
                    name: metadata.name,
                    description: metadata.description,
                    image: metadata.image
                }
            }
            listedItems.push(item)
            // Add listed items to sold array if sold
            if (item.sold) soldItems.push(item)
        }
        setLoading(false)
        setListedItems(listedItems)
        setSoldItems(soldItems)
    }

    useEffect(() => {
        loadListedItems()
    }, [])

    if (loading) {
        <main style={{ padding: "1rem 0" }}>
            <h1>Loading...</h1>
        </main>
    }

    return (
        <div className="flex justify-center">
            {listedItems.length > 0 ? (
                <div className="px-5 py-3 container">
                    <h2>Listed</h2>
                    <Row xs={1} md={2} lg={4} className="g-4 py-3">
                        {listedItems.map((item, index) => {
                            <Col key={index} className="overflow-hidden">
                                <Card>
                                    <Card.Img variant="top" src={item.image} />
                                    <Card.Footer>{ethers.utils.formatEther(item.totalPrice)} ETH</Card.Footer>
                                </Card>
                            </Col>
                        })}
                    </Row>
                    {soldItems.length > 0 && renderSoldItems(soldItems)}
                </div>
            ) : (
                <main style={{ padding: '1rem 0' }}>
                    <h1>No Listed Assets</h1>
                </main>
            )}
        </div>
    )
}