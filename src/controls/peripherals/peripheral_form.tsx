import * as React from "react";
import { Row, Col } from "../../ui/index";
import { destroy, edit } from "../../api/crud";
import { PeripheralFormProps } from "./interfaces";

export function PeripheralForm(props: PeripheralFormProps) {
  let { dispatch } = props;
  return <div>
    {props.peripherals.map(p => {
      return <Row>
        <Col xs={4}>
          <input type="text"
            placeholder="Label"
            value={p.body.label}
            onChange={(e) => {
              let { value } = e.currentTarget;
              dispatch(edit(p, { label: value }));
            }}
          />
        </Col>
        <Col xs={4}>
          <input type="number"
            value={(p.body.pin || "").toString()}
            placeholder="Pin #"
            onChange={(e) => {
              let { value } = e.currentTarget;
              dispatch(edit(p, { pin: value }));
            }} />
        </Col>
        <Col xs={4}>
          <button className="button-like red"
            onClick={() => { dispatch(destroy(p.uuid)); }}>
            <i className="fa fa-minus" />
          </button>
        </Col>
      </Row>
    })}
  </div>
};
