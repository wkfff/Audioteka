import React from 'react';
import ReactDOM from 'react-dom';
import { ipcRenderer } from 'electron';
import Textarea from './Textarea';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Input } from 'reactstrap';
import TableContentsPanel from './TableContentsPanel';
import Label from './Label';

class TableRowPopup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modal: !!this.props.isOpen,
      row: this.props.row,
      blank: this.props.blank
    };

    this.toggle = this.toggle.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.isOpen !== nextProps.isOpen || this.props.row !== nextProps.row) {
      this.setState({
        modal: nextProps.isOpen,
        row: nextProps.row
      });
    }
  }

  toggle() {
    this.setState({
      modal: !this.state.modal
    });
  }

  executeUpdate() {
    let query = '';
    if (!this.props.blank) {
      let params = '';
      for (const key of this.props.cols) {
        if (key.name !== 'id') {
          const param = this.state.row[key.name];
          params += isNaN(param) ? `${key.name}='${param}',` : `${key.name}=${param},` ;
        }
      }
      params = params.substring(0, params.length - 1);
      query = `UPDATE ${this.props.tableName} SET ${params} WHERE id=${this.state.row.id}`;
    } else {
      let params = '';
      let cols = '';
      for(const key of this.props.cols) {
        const param = this.state.row[key.name];
        params += isNaN(param) ? `'${param}',` : `${param},`;
        cols += `${key.name},`;
      }
      cols = cols.substring(0, cols.length - 1);
      params = params.substring(0, params.length - 1);
      query = `INSERT INTO ${this.props.tableName}(${cols}) VALUES(${params});`;
    }
    ipcRenderer.send('queryExecution', query);
    this.toggle();
    this.props.updateRow(this.props.rowIndex, this.state.row);
  }

  executeDelete() {
    const idInput = ReactDOM.findDOMNode(this.refs.id);
    const sqlQuery = `DELETE FROM ${this.props.tableName} WHERE id=${idInput.value}`;
    ipcRenderer.send('queryExecution', sqlQuery);
    this.toggle();
    this.props.deleteRow(this.props.rowIndex);
  }

  valueChanged(e) {
    const element = e.nativeEvent.target;
    const row = Object.assign({}, this.state.row);
    row[element.name] = element.value;
    this.setState({ row });
  }

  render() {
    const dataArray = [];
    for(const key of this.props.cols || []) {
      dataArray.push({ [key.name]: this.state.row[key.name] });
    }
    return (
      <div>
        <Modal isOpen={this.state.modal} size="large" className="modal-large" toggle={this.toggle.bind(this)}>
            <ModalBody>
              {dataArray.map((obj, i) =>
                <div key={i}>
                  <Label for="input" text={Object.keys(obj)[0]}/>
                  <Input ref={Object.keys(obj)[0]} value={Object.values(obj)[0]} name={Object.keys(obj)[0]} onChange={this.valueChanged.bind(this)}/>
                </div>
              )}
            </ModalBody>
          <ModalFooter>
            <Button color="success" onClick={this.executeUpdate.bind(this)}>{this.props.blank ? 'Insert' : 'Update'}</Button>{' '}
            <Button color="danger" onClick={this.executeDelete.bind(this)}>Delete</Button>{' '}
            <Button color="primary" onClick={this.toggle.bind(this)}>Cancel</Button>{' '}
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

Modal.defaultProps = {
  isOpen: false,
  row: {}
};
export default TableRowPopup;
