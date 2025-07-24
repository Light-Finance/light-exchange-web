import React, { Component } from "react";
import { IAcademy } from "../../models";
import "./Academy.component.css";
import { toast } from "react-toastify";
import { AppEventEmitter, AppEvents } from "../../helpers/eventEmitter";
import { ShowAcademy } from "./ShowAcademy.component";
interface IProps {
  item: IAcademy;
}
export class Academy extends Component<IProps> {
  onClick = () => {
    AppEventEmitter.emit(AppEvents.ShowModal, {
      name: this.props.item.title,
      size: "lg",
      modalChildren: <ShowAcademy item={this.props.item} />,
    });
  };
  render() {
    const { illustration, title } = this.props.item;
    return (
      <div className="mb-4">
        <div className="academy-item mb-2" onClick={this.onClick}>
          <img alt={title} src={illustration} width={180} height={200} />
        </div>
        <h6>
          <strong>{title}</strong>
        </h6>
      </div>
    );
  }
}
