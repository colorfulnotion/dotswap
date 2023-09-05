import { Outlet } from "react-router-dom";
import HeaderTopNav from "../components/organism/HeaderTopNav";

const MainLayout = () => {
  return (
    <>
      <HeaderTopNav />
      <Outlet />
    </>
  );
};

export default MainLayout;