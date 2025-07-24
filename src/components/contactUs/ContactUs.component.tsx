import { Formik } from "formik";
import { inject, observer } from "mobx-react";
import React, { Component } from "react";
import { IContactUs } from "../../models";
import { EmailStore } from "../../stores/email.store";
import "./ContactUs.component.css";
import contactUsGif from "../../assets/imgs/home/contact-us-gif.gif";
interface IProps {
  emailStore?: EmailStore;
}
@inject("emailStore")
@observer
export class ContactUs extends Component<IProps> {
  initialValues = {
    subject: "",
    email: "",
    message: "",
  };
  submit = async (values: IContactUs, resetForm: any) => {
    const result = await this.props.emailStore!.contactUs(values);
    if (result) resetForm();
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
          <div className="contactUs text-start p-sm-5 p-3">
            <div className=" container    ">
              <div className="contactUs-card " id="contactUs">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <img src={contactUsGif} className="img-fluid" />
                  </div>
                  <div className="col-md-6">
                    <h1 className="mb-5">Contact Us</h1>
                    <div className="mb-3">
                      <label className="form-label">Subject</label>
                      <input
                        className="form-control form-control-lg"
                        value={values.subject}
                        onChange={handleChange("subject")}
                        placeholder="Enter your subject"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Your Email</label>
                      <input
                        type="email"
                        className="form-control form-control-lg"
                        value={values.email}
                        onChange={handleChange("email")}
                        placeholder="Enter your email address"
                      />
                    </div>
                    <label className="form-label">Your Message</label>
                    <textarea
                      placeholder="Your message here..."
                      value={values.message}
                      onChange={handleChange("message")}
                      className="form-control form-control-lg"
                    ></textarea>
                    <button
                      className="btn btn-secondary1 btn-lg mt-5"
                      onClick={(e) => handleSubmit()}
                    >
                      Submit{" "}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Formik>
    );
  }
}
