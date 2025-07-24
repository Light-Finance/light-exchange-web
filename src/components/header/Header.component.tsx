import { inject, observer } from "mobx-react";
import React, { Component } from "react";
import { WEBSITE_NAME } from "../..";
import { ROUTES } from "../../consts/routes";
import { AuthStore } from "../../stores/auth.store";
import "./Header.component.css";

interface IProps {
  authStore?: AuthStore;
  order?: number;
}
@inject("authStore")
@observer
export class Header extends Component<IProps> {
  state = {
    order: this.props.order || 0,
  };

  render() {
    const LOGO_SIZE = 60;
    const { order } = this.props;
    return (
      <nav className="navbar navbar-expand-lg navbar-light background-gradient fixed-top">
        <div className="container">
          <a className="navbar-brand" href={ROUTES.mining}>
            <div className="d-flex align-items-center">
              <div>
                {" "}
                <img
                  alt=""
                  src="/logo512.png"
                  width={LOGO_SIZE}
                  height={LOGO_SIZE}
                  className="logo-image me-1"
                />
              </div>
              <div>
                <strong className="text-white">
                  &nbsp;&nbsp;{WEBSITE_NAME}
                </strong>
              </div>
            </div>
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <li className={`nav-item ${order === 1 && "nav-bottom-border"}`}>
                <a className="nav-link" href="#lightExchange">
                  <span className=" text-white">Light Exchange</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    );
  }
}
