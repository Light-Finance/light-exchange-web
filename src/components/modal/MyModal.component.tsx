import React, {Component} from 'react'
import { Modal } from 'react-bootstrap'
import { AppEventEmitter, AppEvents } from '../../helpers/eventEmitter'

interface IProps {
  name: string;
  size?: any;
}
class MyModal extends Component<IProps> {
  state = { show: true }
  static defaultProps = {
    size: "lg"
  }
  handleClose = ()=>{
    AppEventEmitter.emit(AppEvents.HideModal, {name: this.props.name})
  }
  render() {
    return <Modal show={true} size={this.props.size!} onHide={this.handleClose} centered>
    <Modal.Header closeButton>
      <Modal.Title>{this.props.name}</Modal.Title>
    </Modal.Header>
    <div className="align-items-center justify-content-center">
    {this.props.children}
    </div>
    <Modal.Footer>
    </Modal.Footer>
  </Modal>
  }
}

export default MyModal