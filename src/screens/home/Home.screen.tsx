import React, { Component } from "react";
import { Header } from "../../components/header/Header.component";
import { LightExchange } from "../../components/lightExchange/LightExchange.component";
export class Home extends Component {
  render() {
    return (
      <div>
        <Header order={0} />
        <LightExchange />
      </div>
    );
  }
}
