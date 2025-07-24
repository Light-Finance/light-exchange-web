import {
  faTelegram,
  faTwitter,
  faWhatsapp,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import {
  faBook,
  faEnvelope,
  faHandHoldingDollar,
  faLightbulb,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { Component } from "react";
import { ROUTES } from "../../consts/routes";
import { Link } from "react-router-dom";
import "./Footer.component.css";
export class Footer extends Component {
  render() {
    return (
      <div className="footer text-start">
        <div className="container p-5">
          <div className="row ">
            <div className="col-md-3 mb-3">
              <h5 className="mb-4 text-white">Light Finance</h5>
              <p className="text-white">LF brings Light To Finance.</p>
            </div>
            <div className="col-md-3 mb-3">
              <h5 className="mb-4 text-white">Light Exchange</h5>
              <div className="mb-3 pointer footer-link">
                <a href={ROUTES.root + "#lightExchange"}>
                  <FontAwesomeIcon icon={faHandHoldingDollar} /> Buy Usdt
                </a>
              </div>
              <div className="mb-3 pointer footer-link">
                <a href={ROUTES.root + "#lightExchange"}>
                  <FontAwesomeIcon icon={faHandHoldingDollar} /> Sell Usdt
                </a>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <h5 className="mb-4  text-white"> Light Academy</h5>
              <div className="mb-3 pointer footer-link">
                <a href={ROUTES.root + "#lightAcademy"}>
                  <FontAwesomeIcon icon={faBook} /> Comment devenir Riche avec
                  les cryptos (Débutants)
                </a>
              </div>
              <div className="mb-3 pointer footer-link">
                <a href={ROUTES.root + "#lightAcademy"}>
                  <FontAwesomeIcon icon={faBook} /> Trading Spot sur Binance
                </a>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <h5 className="mb-4 text-white">Community</h5>
              <div className="mb-3 d-flex justify-content-between">
                <div>
                  <a
                    href="https://www.youtube.com/c/lightFinance"
                    className="link text-white"
                    target={"_blank"}
                    rel="noreferrer"
                  >
                    <FontAwesomeIcon icon={faYoutube} />{" "}
                  </a>
                </div>
                <div>
                  <a
                    href="https://t.me/light_finance237"
                    className="link text-white"
                    target={"_blank"}
                    rel="noreferrer"
                  >
                    <FontAwesomeIcon icon={faTelegram} />{" "}
                  </a>
                </div>
                <div>
                  <a
                    href="https://twitter.com/lightfinance237"
                    target={"_blank"}
                    className="link text-white"
                    rel="noreferrer"
                  >
                    <FontAwesomeIcon icon={faTwitter} />{" "}
                  </a>
                </div>
                <div>
                  <a
                    href="https://chat.whatsapp.com/DsCu31ogPYNFiPym8VX9Hy"
                    className="link text-white"
                    target={"_blank"}
                    rel="noreferrer"
                  >
                    <FontAwesomeIcon icon={faWhatsapp} />{" "}
                  </a>
                </div>
              </div>
              <div className="mb-3 footer-link">
                {" "}
                <FontAwesomeIcon icon={faWhatsapp} /> +237694481723
              </div>
              <div className=" font-size-small footer-link">
                {" "}
                <FontAwesomeIcon icon={faEnvelope} />
                &nbsp; lightfinance237@gmail.com
              </div>
            </div>
          </div>
        </div>
        <div className="sub-footer text-white p-4 text-center font-size-small">
          <div className="mb-2">
            Light Finance <FontAwesomeIcon icon={faLightbulb} />{" "}
          </div>
          <div>Copyright 2025. All rights reserved.</div>
        </div>
      </div>
    );
  }
}
