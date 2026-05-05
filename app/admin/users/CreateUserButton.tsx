"use client";

import { useState } from "react";
import { CreateUserModal } from "./UserActions";

export default function CreateUserButton({ teacherMode = false }: { teacherMode?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <>
      {show && <CreateUserModal onClose={() => setShow(false)} teacherMode={teacherMode} />}
      <button
        onClick={() => setShow(true)}
        className="btn-primary text-sm"
      >
        {teacherMode ? "+ Tələbə Əlavə Et" : "+ Yeni İstifadəçi"}
      </button>
    </>
  );
}
