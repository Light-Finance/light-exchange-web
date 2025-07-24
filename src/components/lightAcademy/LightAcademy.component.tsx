import React, { Component } from "react";
import trading_spot from "../../assets/imgs/home/trading.png";
import crypto from "../../assets/imgs/home/cryptocurrency.png";
import bitcoin from "../../assets/imgs/home/bitcoin.png";
import trading_marge from "../../assets/imgs/home/stock.png";
import peer_to_peer from "../../assets/imgs/home/peer-to-peer.png";
import financial_profit from "../../assets/imgs/home/financial-profit.png";
import data_analysis from "../../assets/imgs/home/data-analysis.png";
import pepe from "../../assets/imgs/pepecoin.png";
import "./LightAcademy.component.css";
import { Academy } from "./Academy.component";
const freeDownloadLink =
  "https://light-finance.gitbook.io/presentation-des-formations-light-finance";
const academies1 = [
  {
    title: "Comment devenir Riche avec les cryptos (Débutants)",
    illustration: crypto,
    youtubeIllustration: "URYVh24G_Ec",
    sommaire: [
      "Chap0: Introduction",
      "Chap1: Comment utiliser CoinMarketCap",
      "Chap3: Les différentes méthodes pour générer de l'argent",
      "...",
    ],
    freeDownloadLink,
    paidDownloadLink: "",
    marketingPrice: 359,
    price: 99,
    status: true,
  },
  {
    title: "Trading Spot sur Binance",
    illustration: trading_spot,
    youtubeIllustration: "s2Z3abK2O9Q",
    sommaire: [
      "Chap0: Créer son compte et KYC",
      "Chap1: Introduction et définitions",
      "Chap3: Marchés financiers et outils de trading",
      "...",
    ],
    freeDownloadLink,
    paidDownloadLink: "",
    marketingPrice: 420,
    price: 199,
    status: true,
  },
  {
    title: "Trading Marge sur Binance",
    illustration: trading_marge,
    youtubeIllustration: "s2Z3abK2O9Q",
    sommaire: [
      "Chap0: Créer son compte et KYC",
      "Chap1: Introduction et définitions",
      "Chap3: Trading Spot vs Trading sur Marge",
      "...",
    ],
    freeDownloadLink,
    paidDownloadLink: "",
    marketingPrice: 800,
    price: 350,
    status: true,
  },
  {
    title: "Minage des cryptomonnaies",
    illustration: bitcoin,
    youtubeIllustration: "s2Z3abK2O9Q",
    sommaire: [
      "Chap0: Introduction au minage",
      "Chap1: Proof of work",
      "Chap3: Matériels de minage",
      "...",
    ],
    freeDownloadLink,
    paidDownloadLink: "",
    marketingPrice: 1000,
    price: 489,
    status: true,
  },
];
const academies2 = [
  {
    title: "Trading P2P Binance et Paxul",
    illustration: peer_to_peer,
    youtubeIllustration: "s2Z3abK2O9Q",
    sommaire: [
      "Chap0: Créer son compte et KYC",
      "Chap1: Introduction et définitions",
      "Chap3: Comment fonctionne le P2P",
      "...",
    ],
    freeDownloadLink,
    paidDownloadLink: "",
    marketingPrice: 678,
    price: 250,
    status: true,
  },
  {
    title: "Analyse fondamentale",
    illustration: data_analysis,
    youtubeIllustration: "s2Z3abK2O9Q",
    sommaire: [
      "Chap0: Qu'est ce que l'analyse Fondamentale",
      "Chap1: Introduction a CoinmarketCap",
      "Chap3: Définition des termes",
      "...",
    ],
    freeDownloadLink,
    paidDownloadLink: "",
    marketingPrice: 370,
    price: 150,
    status: true,
  },
  {
    title: "Analyse Technique",
    illustration: financial_profit,
    youtubeIllustration: "s2Z3abK2O9Q",
    sommaire: [
      "Chap0: Qu'est ce que l'analyse Technique",
      "Chap1: Introduction a TradingView",
      "Chap3: Qu'est ce qu'un chandelier Japonais",
      "...",
    ],
    freeDownloadLink,
    paidDownloadLink: "",
    marketingPrice: 1200,
    price: 500,
    status: true,
  },
  {
    title: "Millionnaire avec les Memecoins",
    illustration: pepe,
    youtubeIllustration: "s2Z3abK2O9Q",
    sommaire: [
      "Chap0: Qu'est ce qu'un MEMECOIN",
      "Chap1: La Hype",
      "Chap3: Termes associés aux memes",
      "...",
    ],
    freeDownloadLink,
    paidDownloadLink: "",
    marketingPrice: 900,
    price: 350,
    status: true,
  },
];

export class LightAcademy extends Component {
  render() {
    return (
      <div id="lightAcademy" className="container p-sm-5 p-3">
        <h3 className="text-secondary1 mb-5 mt-5 text-center">
          <strong>Light Academy</strong>
        </h3>
        <h5 className="mb-5 text-center ">A broad selection of formations</h5>
        <div className="p-5">
          <div className="row mb-4">
            {academies1.map((academy) => (
              <div className="col-md-3">
                <Academy item={academy} />
              </div>
            ))}
          </div>
          <div className="row">
            {academies2.map((academy) => (
              <div className="col-md-3">
                <Academy item={academy} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
