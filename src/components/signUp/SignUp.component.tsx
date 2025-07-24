import { Formik } from "formik";
import React, { Component } from "react";
import { IUser } from "../../models";
import { AppEventEmitter, AppEvents } from "../../helpers/eventEmitter";
import { MODALS } from "../../consts/modals";
import { inject, observer } from "mobx-react";
import { AuthStore } from "../../stores/auth.store";
import { toast } from "react-toastify";
import { ERRORS_MESSAGES } from "../../consts/errors";
import { SignIn } from "../signIn/SignIn.component";
interface IProps {
  authStore?: AuthStore;
}
@inject("authStore")
@observer
export class SignUp extends Component<IProps> {
  initialValues = {
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    refererBy: "",
  };
  submit = async (values: IUser, resetForm: any) => {
    if (values.confirmPassword !== values.password) {
      toast.error(ERRORS_MESSAGES.password, { autoClose: 3000 });
      return;
    }
    await this.props?.authStore?.signUp(values);
  };
  openSignIn = () => {
    AppEventEmitter.emit(AppEvents.HideModal, { name: MODALS.signUp });
    AppEventEmitter.emit(AppEvents.ShowModal, {
      name: MODALS.signIn,
      size: "md",
      modalChildren: <SignIn />,
    });
  };
  render() {
    return (
      <Formik
        initialValues={this.initialValues}
        onSubmit={(values: any, { resetForm }) =>
          this.submit(values, resetForm)
        }
      >
        {({ handleChange, handleSubmit, values }) => (
          <div className="container p-sm-4">
            <h6 className="mt-3 mb-3 text-start">Your name</h6>
            <input
              className="form-control "
              value={values.name}
              onChange={handleChange("name")}
              placeholder="Light Finance"
            />
            <h6 className="mt-3 mb-3 text-start">Your email</h6>
            <input
              className="form-control"
              value={values.email}
              onChange={handleChange("email")}
              placeholder="lightfinance237@gmail.com"
            />
            <h6 className="mt-3 mb-3 text-start">Your phone number</h6>
            <input
              className="form-control"
              value={values.phone}
              onChange={handleChange("phone")}
              placeholder="+xxxxxxxxxx"
            />
            <h6 className="mt-3 mb-3 text-start">Your password</h6>
            <input
              className="form-control"
              value={values.password}
              type="password"
              onChange={handleChange("password")}
              placeholder="*****"
            />
            <h6 className="mt-3 mb-3 text-start">Confirm your password</h6>
            <input
              className="form-control"
              value={values.confirmPassword}
              type="password"
              onChange={handleChange("confirmPassword")}
              placeholder="*****"
            />
            <h6 className="mt-3 mb-3 text-start">
              Your referal code(optional)
            </h6>
            <input
              className="form-control "
              value={values.refererBy}
              onChange={handleChange("refererBy")}
              placeholder="xdakjd"
            />

            <div className="mt-3 text-center">
              <button
                className="btn btn-secondary1"
                onClick={(e) => handleSubmit()}
              >
                Sign Up
              </button>
            </div>
            <div className="mt-3 text-end pointer" onClick={this.openSignIn}>
              <strong className="font-size-small text-secondary1">
                Already a member, Sign In
              </strong>
            </div>
          </div>
        )}
      </Formik>
    );
  }
}
