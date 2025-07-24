import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { Provider } from "mobx-react";
import reportWebVitals from "./reportWebVitals";
import { appRootStore } from "./stores/root.store";
import { BrowserRouter } from "react-router-dom";
export const lightExchange = "https://exchange.lightfinance.com";
export const WHATSAPP = "https://wa.me/237694481723";
export const WEBSITE_NAME = "Light Finance";
ReactDOM.render(
  <BrowserRouter>
    <Provider {...appRootStore}>
      <App />
    </Provider>
  </BrowserRouter>,
  document.getElementById("root")
);

reportWebVitals();
