import React, { Component } from "react";
import DotLoader from "react-spinners/DotLoader";
import { COLORS } from "../../assets/styles/theme.style";
import './Spinner.css';
interface IProps {
  spinnerVisible: boolean;
}
export class Spinner extends Component<IProps> {
  render() {
    const {spinnerVisible} = this.props;
    return (
      spinnerVisible&&<div className="spinner">
        <DotLoader color={COLORS.secondary} loading={spinnerVisible} />
      </div>
    );
  }
}
