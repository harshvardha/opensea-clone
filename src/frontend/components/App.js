import { BrowserRouter, Route, Routes } from "react-router-dom"
import './App.css';
import Navigation from './NavBar';
import { useState } from "react"
import { ethers } from "ethers";
import MarketplaceAbi from "../contractsData/MarketPlace.json"
import MarketplaceAddress from "../contractsData/MarketPlace-address.json"
import NFTAddress from "../contractsData/NFT-address.json"
import NFTAbi from "../contractsData/NFT.json"
import Home from "./Home"
import Create from "./Create"
import MyListedItem from "./MyListedItem"
import MyPurchases from "./MyPurchases"
import { Spinner } from "react-bootstrap"

function App() {
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState(null)
  const [nft, setNFT] = useState({})
  const [marketPlace, setMarketPlace] = useState({})
  // Metamask Provider
  const web3Handler = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    setAccount(accounts[0])
    // Get provider from metamask
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    // Get signer
    const signer = provider.getSigner()
    loadContracts(signer)
  }

  const loadContracts = async (signer) => {
    // Get deployed copies of contract
    const marketPlace = new ethers.Contract(MarketplaceAddress.address, MarketplaceAbi.abi, signer)
    setMarketPlace(marketPlace)
    const nft = new ethers.Contract(NFTAddress.address, NFTAbi.abi, signer)
    setNFT(nft)
    setLoading(false)
  }
  return (
    <BrowserRouter>
      <div className="App">
        <Navigation web3Handler={web3Handler} account={account} />
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <Spinner animation="border" style={{ display: 'flex' }} />
            <p className="mx-3 my-0">Awaiting Metamask Connection</p>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Home marketPlace={marketPlace} nft={nft} />} />
            <Route path="/create" element={<Create marketPlace={marketPlace} nft={nft} />} />
            <Route path="/my-listed-items" element={<MyListedItem marketPlace={marketPlace} nft={nft} account={account} />} />
            <Route path="/my-purchases" element={<MyPurchases marketPlace={marketPlace} nft={nft} account={account} />} />
          </Routes>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
