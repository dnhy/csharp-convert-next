"use client";

import { useCurrentModalAction } from "@/components/ui/modal/ModalImpl";
import {
  presentModal,
  useModalStack,
} from "@/components/ui/modal/useModalStack";
import { Button, Space } from "antd";
import { createElement } from "react";

export default function ModalTest() {
  return <ModalEg01 />;
}

const ModalEg01 = () => {
  const { present } = useModalStack();

  return (
    <button
      onClick={() => {
        present({
          title: "Modal Test",
          content: <ModalContent02 />,
        });
      }}
    >
      Modal Stack
    </button>
  );
};

const ModalContent = () => {
  const { dismiss } = useCurrentModalAction();

  return (
    <div>
      This is the modal content.
      <br />
      <button onClick={dismiss}>Dismiss</button>
    </div>
  );
};

const ModalContent02 = () => {
  const { present, dismissAll } = useModalStack();
  const { dismiss } = useCurrentModalAction();

  return (
    <div>
      This Modal Content;
      <Space.Compact>
        <Button
          onClick={() => {
            present({
              title: "Modal Test",
              content: <ModalContent02 />,
            });
          }}
        >
          Present New
        </Button>
        <Button onClick={dismiss}>Dismiss this</Button>
        <Button onClick={dismissAll}>Dismiss all</Button>
      </Space.Compact>
    </div>
  );
};


const eventHandler = (type: string) => {
  switch (type) {
    case "Notify":
      presentModal({
        title: "Handle test",
        content: createElement("div", null, "Some notify here"),
      });
  }
};

const ModalEg02 = () => {
  return (
    <div
      onClick={() => {
        eventHandler("Notify");
      }}
    >
      click here
    </div>
  );
};
