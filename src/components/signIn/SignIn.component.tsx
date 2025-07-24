import { Formik } from 'formik'
import React, {Component} from 'react'
import { IUser } from '../../models'
import { AppEventEmitter, AppEvents } from '../../helpers/eventEmitter'
import { MODALS } from '../../consts/modals'
import { inject, observer } from 'mobx-react'
import { AuthStore } from '../../stores/auth.store'
import { SignUp } from '../signUp/SignUp.component'
interface IProps{
    authStore?: AuthStore;
}
@inject("authStore")
@observer
export class SignIn extends Component<IProps>{
    initialValues = {
        email:"",
        password: ""
    }
    submit = async(values: IUser, resetForm:any)=>{
        await this.props?.authStore?.signIn(values)
    }
    openSignUp = ()=>{
        AppEventEmitter.emit(AppEvents.HideModal,{name: MODALS.signIn})
        AppEventEmitter.emit(AppEvents.ShowModal, { name: MODALS.signUp, size: "md", modalChildren: <SignUp /> })
    }
    render(){
        return <Formik
        initialValues={this.initialValues}
        onSubmit={(values: any, { resetForm }) => this.submit(values, resetForm)}>
        {({ handleChange, handleSubmit, values }) =><div className='container p-sm-4'>
            <h6 className='mt-3 mb-3 text-start'>Your email</h6>
            <input className='form-control' value={values.email} onChange={handleChange("email")} placeholder='lightfinance237@gmail.com' />
             <h6 className='mt-3 mb-3 text-start'>Your password</h6>
            <input className='form-control' value={values.password} type="password" onChange={handleChange("password")} placeholder='*****' />
              <div className='mt-3 text-center'>
                <button className='btn btn-secondary1'   onClick={e =>handleSubmit() }>Sign In</button>
            </div>
            <div className="mt-3 text-end pointer" onClick={this.openSignUp}>
                <strong className='font-size-small text-secondary1'>Not a member yet, Sign Up</strong>
            </div>
        </div>}
        </Formik>
    }
}