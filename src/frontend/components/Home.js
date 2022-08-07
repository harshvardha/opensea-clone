import { useState } from "react"
import { ethers } from "ethers"
import { Row, Col, Card, Button } from "react-bootstrap"
import { useEffect } from "react"

const Home = ({ marketPlace, nft }) => {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const loadMarketPlaceItems = async () => {
        const itemCount = await marketPlace.itemCount()
        let items = []
        for (let i = 1; i <= itemCount; i++) {
            const item = await marketPlace.items(i)
            if (!item.sold) {
                // get url from nft contract
                const uri = await nft.tokenURI(item.tokenId)
                // use uri to fetch the nft metadata stored on ipfs
                const response = await fetch(uri)
                const metadata = await response.json()
                // get total price of item (itemprice + fee)
                const totalPrice = await marketPlace.getTotalPrice(item.itemId)
                // Add item to items array
                items.push({
                    totalPrice,
                    itemId: item.itemId,
                    seller: item.seller,
                    name: metadata.name,
                    description: metadata.description,
                    image: metadata.image
                })
            }
        }
        setLoading(false)
        setItems(items)
    }

    const buyMarketItems = async (item) => {
        await (await marketPlace.purchaseItem(item.itemId, { value: item.totalPrice })).wait()
        loadMarketPlaceItems()
    }

    useEffect(() => {
        loadMarketPlaceItems()
    }, [])

    if (loading) {
        return (
            <main style={{ padding: "1rem 0" }}>
                <h1>loading...</h1>
            </main>
        )
    }

    return (
        <div className="flex justify-center">
            {items.length > 0 ? (
                <div className="px-5 container">
                    <Row xs={1} md={2} lg={4} className="g-4 py-5">
                        {items.map((item, index) => {
                            <Col key={index} className="overflow-hidden">
                                <Card>
                                    <Card.Img variant="top" src={item.image} />
                                    <Card.Body color="secondary">
                                        <Card.Title>{item.name}</Card.Title>
                                        <Card.Text>
                                            {item.description}
                                        </Card.Text>
                                    </Card.Body>
                                    <Card.Footer>
                                        <div className="d-grid">
                                            <Button onClick={() => buyMarketItems(item)} variant="primary" size="lg">
                                                Buy for {ethers.utils.formatEther(item.totalPrice)} ETH
                                            </Button>
                                        </div>
                                    </Card.Footer>
                                </Card>
                            </Col>
                        })}
                    </Row>
                </div>
            ) : (
                <main style={{ padding: '1rem 0' }}>
                    <h1>No Listed Assets</h1>
                </main>
            )}
        </div>
    )
}

export default Home