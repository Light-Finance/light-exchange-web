import React, { Component } from "react";
import "./LightExchange.component.css";
import { AppEventEmitter, AppEvents } from "../../helpers/eventEmitter";
import { MODALS } from "../../consts/modals";
import { SignIn } from "../signIn/SignIn.component";
import lightExchangeMobile from "../../assets/imgs/home/light-exchange-mobile.png";
export class LightExchange extends Component {
  signIn = () => {
    AppEventEmitter.emit(AppEvents.ShowModal, {
      name: MODALS.signIn,
      size: "md",
      modalChildren: <SignIn />,
    });
  };
  render() {
    return (
      <div id="lightExchange" className="container p-sm-5 p-3">
        <h3 className="text-secondary1 mb-5 mt-5 text-center">
          <strong>Light Exchange</strong>
        </h3>
        <h5 className="mb-5 text-center ">Access crypto world instantly</h5>
        <div className="container">
          <div className="row">
            <div className="col-12 col-md-6 align-self-center mb-4 mb-md-0">
              <div className="align-self-center text-start">
                <h2 className=" mb-4">Light Exchange</h2>
                <p className="text-start mb-4">
                  Light Exchange est une application mobile disponible sur
                  playstore qui vous permet de trader des cryptos, mais aussi
                  d'investir sur des produits financiers.
                </p>
                <p>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.lightexchangemobile"
                    className="btn btn-secondary"
                  >
                    Télécharger Light Exchange{" "}
                  </a>
                </p>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <img className="img-fluid rounded" src={lightExchangeMobile} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
