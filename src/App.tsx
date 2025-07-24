import React, { Component } from "react";
import "./App.css";
import { AppEventEmitter, AppEvents } from "./helpers/eventEmitter";
import { IModal } from "./models";
import { Spinner } from "./components/spinner/Spinner.component";
import MyModal from "./components/modal/MyModal.component";
import { Route, Switch } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { ROUTES } from "./consts/routes";
import { Home } from "./screens/home/Home.screen";
interface IState {
  spinnerVisible: boolean;
  modals: IModal[];
}
class App extends Component {
  state: IState = {
    spinnerVisible: false,
    modals: [],
  };
  overlaySpinnerUnsubscribe: any = null;
  modalUnsubscribe: any = null;
  closeModalUnsubscribe: any = null;
  componentDidMount() {
    this.overlaySpinnerUnsubscribe = AppEventEmitter.subscribe(
      AppEvents.OverlaySpinner,
      (spinnerVisible: boolean) => {
        this.setState({ spinnerVisible });
      }
    );

    this.modalUnsubscribe = AppEventEmitter.subscribe(
      AppEvents.ShowModal,
      (data: IModal) => {
        const { name, modalChildren } = data;
        const modals = this.state.modals;
        modals.push({ name, modalChildren });
        this.setState({ modals });
      }
    );
    this.closeModalUnsubscribe = AppEventEmitter.subscribe(
      AppEvents.HideModal,
      (name: string) => {
        const indexOf = this.state.modals
          .map((modal) => modal!.name)
          .indexOf(name);
        const modals = this.state.modals;
        modals.splice(indexOf, 1);
        this.setState({ modals });
      }
    );
  }

  componentWillUnmount() {
    if (this.overlaySpinnerUnsubscribe) {
      this.overlaySpinnerUnsubscribe();
    }
    if (this.closeModalUnsubscribe) {
      this.closeModalUnsubscribe();
    }
    if (this.modalUnsubscribe) {
      this.modalUnsubscribe();
    }
  }
  render() {
    const { modals, spinnerVisible } = this.state;
    return (
      <div className="App">
        <Spinner spinnerVisible={spinnerVisible} />
        {modals.map((modal, i) => (
          <MyModal name={modal!.name} key={i} size={modal?.size}>
            {modal!.modalChildren}
          </MyModal>
        ))}
        <ToastContainer newestOnTop={true} />
        <Switch>
          <Route path={ROUTES.root} exact>
            <Home />
          </Route>
        </Switch>
      </div>
    );
  }
}
export default App;
