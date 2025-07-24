import { inject, observer } from "mobx-react";
import React, { Component } from "react";
import YouTube from "react-youtube";
import { WHATSAPP } from "../..";
import { IAcademy } from "../../models";
import { AuthStore } from "../../stores/auth.store";
import "./ShowAcademy.component.css";

interface IProps {
  item: IAcademy;
  authStore?: AuthStore;
}
@inject("authStore")
@observer
export class ShowAcademy extends Component<IProps> {
  buyForFree = () => {
    window.open(this.props.item.freeDownloadLink);
  };
  buy = () => {
    window.open(
      WHATSAPP + "?text=Light%20Academy%20Bonjour%20Besoin%20de%20formation"
    );
  };
  render() {
    const { youtubeIllustration, sommaire, price, marketingPrice } =
      this.props.item;
    return (
      <div className="container p-5">
        <YouTube
          videoId={youtubeIllustration}
          className="youtube img-fluid w-100"
        />
        <div className="row m-0 mt-2 mb-2 price-container">
          <div className="col-sm-6">
            <span className="marketing-price">{marketingPrice}$</span>
          </div>
          <div className="col-sm-6 text-end">
            <span className="price">{price}$</span>
          </div>
        </div>
        <div className="mt-3 mb-3">
          <ul className="list-group">
            {sommaire!.map((s, i) => (
              <li key={i} className="list-group-item">
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="row m-0">
          <div className="mb-2 col-sm-6 ">
            <button className="btn  btn-danger  btn-lg" onClick={this.buy}>
              Acheter maintenant
            </button>
          </div>
          <div className="col-sm-6 text-end">
            <button
              className="btn btn-secondary1 btn-lg"
              onClick={this.buyForFree}
            >
              J'essaye maintenant 0$
            </button>
          </div>
        </div>
      </div>
    );
  }
}
