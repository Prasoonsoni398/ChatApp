import {useState} from "react";

const Navbar = () => {
    const [selectTheme,setSelectTheme] = useState("mintlify")
    const handleThemeChange = (e)=>{
      setSelectTheme(e.target.value)
      document.documentElement.setAttribute("data-theme",e.target.value)
      console.log(selectTheme)
    }
  return (
    <>
      <div className="flex justify-between px-6 py-2 bg-primary text-primary-content items-center">
        <a href="/" className="text-xl font-bold">
          Guftagu
        </a>
      <select className="outline-none select max-w-32 rounded-full bg-primary-focus text-primary-focus" value={selectTheme} onChange={handleThemeChange}  name="theme" id="theme">
        <option value="" disabled selected>
          Select theme
        </option>
        <option value="ghibli">Ghibli</option>
        <option value="dracula">Dracula</option>
        <option value="corporate">Corporate</option>
        <option value="mintlify">Mintlify</option>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
        <option value="luxury">Luxury</option>
        <option value="black">Black</option>
      </select>
      </div>
    </>
  );
};

export default Navbar;
