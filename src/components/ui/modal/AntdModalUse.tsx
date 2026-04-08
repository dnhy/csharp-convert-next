"use client";

import { StarOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";

export default function AntdModalUse() {
  const [modal, contextHolder] = Modal.useModal();

  return (
    <div>
      <Button
        onClick={async () => {
          const confirmed = await modal.confirm({
            title: "modal test",
            cancelText: "hide",
            closeIcon: <StarOutlined />,
            closable:true
          });
          console.log("Confirmed: ", confirmed);
        }}
      >
        Confirm 
      </Button>
      {contextHolder}
    </div>
  );
}
