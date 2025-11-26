import { useState } from 'react';

export default function MainPage(){
  const [passwordVisibility, setPasswordVisibility] = useState("password");

  function changeVisibilityOfPassword(){
    if(passwordVisibility === "text"){
      setPasswordVisibility("password");
    }else{
      setPasswordVisibility("text");
    }
  }

  return <div id="mainContainer">
          <h1 id="title">Login</h1>

          <form id="mainForm">
            <input type="text" id="userName" class="inputs" placeholder="Username"></input>
            <input type={passwordVisibility} id="password" class="inputs" placeholder="Password"></input>
            <button type="button" id="passwordVisibilityChange" onClick={changeVisibilityOfPassword}>X</button>
            <input type="submit" id="submit"></input>
          </form>

          <h5 id="copyright">Copyright TeleMechanik 2025-2026©</h5>
        </div>
}
