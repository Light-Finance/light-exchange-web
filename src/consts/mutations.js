import gql from "graphql-tag";
export const NEWSLETTER = gql`
mutation newsletter($email: String!){
    newsletter(email:$email)
}
`

export const CONTACT_US = gql`
mutation contactUs($email: String!,$subject: String!, $message: String!){
    contactUs(email:$email, subject: $subject, message: $message)
}
`
export const SIGN_UP = gql`
mutation signUp($name: String!, $email: String!, $phone: String!, $password: String!,$refererBy: String){
    signUp(name:$name, email: $email,phone: $phone, password: $password,refererBy:$refererBy){
        id
        name
        referalCode
    }
}
`

export const SIGN_IN = gql`
mutation signIn( $email: String!, $password: String!){
    signIn( email: $email, password: $password){
        id
        name
        referalCode
    }
}
`