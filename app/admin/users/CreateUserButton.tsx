"use client";

import { useState } from "react";
import { CreateUserModal } from "./UserActions";

export default function CreateUserButton() {
  const [show, setShow] = useState(false);
  return (
    <>
      {show && <CreateUserModal onClose={() => setShow(false)} />}
      <button
        onClick={() => setShow(true)}
        className="btn-primary text-sm"
      >
        + Yeni İstifadəçi
      </button>
    </>
  );
}
