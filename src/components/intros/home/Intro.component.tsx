import React, { Component } from "react";
import YouTube from "react-youtube";
import "./Intro.component.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookAtlas, faLightbulb } from "@fortawesome/free-solid-svg-icons";
import {
  faBitcoin,
  faTelegram,
  faTwitter,
  faWhatsapp,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
export class Intro extends Component {
  render() {
    return (
      <div
        className="mining-intro d-flex justify-content-center align-items-center mb-5 "
        id="#who_are_we"
      >
        <div className="container">
          <h2 className="text-center text-white mb-5 mt-3">
            The Next Crypto Bank <FontAwesomeIcon icon={faLightbulb} /> .
          </h2>
          <div className="row ">
            <div className="col-sm-6 mt-5">
              <div className="text-white">
                <h1 className="text-white font-weight-bold mb-5">
                  <strong>Our Services ?</strong>
                </h1>
                <div className="d-flex flex-row">
                  <div className="me-3">
                    <a href="#lightExchange" rel="noreferrer" className="link">
                      <h5 className="d-flex align-items-center mb-4 ">
                        <div className="me-2">
                          <FontAwesomeIcon icon={faBitcoin} size="lg" />
                        </div>{" "}
                        <div>&nbsp;&nbsp;Light Exchange</div>
                      </h5>
                    </a>

                    <a href="#lightAcademy" rel="noreferrer" className="link">
                      <h5 className="d-flex align-items-center">
                        <div className="me-3">
                          <FontAwesomeIcon icon={faBookAtlas} size="lg" />
                        </div>{" "}
                        <div>&nbsp;Light Academy</div>
                      </h5>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-12 mt-5">
              <YouTube videoId="iUU8mi9u7DU" className="youtube img-fluid" />
            </div>
          </div>
          <div className="mt-5 d-flex justify-content-center">
            <a
              href="https://www.youtube.com/c/lightFinance"
              target={"_blank"}
              rel="noreferrer"
              className="link"
            >
              <div>
                <FontAwesomeIcon icon={faYoutube} color="red" />{" "}
                <span className="text-white">
                  Youtube&nbsp;&nbsp;&nbsp;&nbsp;
                </span>
              </div>
            </a>
            <a href="" target={"_blank"} rel="noreferrer" className="link">
              <div>
                <FontAwesomeIcon icon={faWhatsapp} color="#2374E1" />{" "}
                <span className="text-white">
                  Whatsapp&nbsp;&nbsp;&nbsp;&nbsp;
                </span>
              </div>
            </a>
            <a
              href="https://x.com/lightfinance237"
              target={"_blank"}
              rel="noreferrer"
              className="link"
            >
              <div>
                <FontAwesomeIcon icon={faTelegram} color="#1DA1F2" />{" "}
                <span className="text-white">Telegram</span>
              </div>
            </a>
            &nbsp;&nbsp;
            <a
              href="https://x.com/lightfinance237"
              target={"_blank"}
              rel="noreferrer"
              className="link"
            >
              <div>
                <FontAwesomeIcon icon={faTwitter} color="#1DA1F2" />{" "}
                <span className="text-white">X</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    );
  }
}
