import { useState } from 'react';

import passwdShow from "./assets/passwd_show.png";
import passwdHide from "./assets/passwd_hide.png";

export default function MainPage(){
  const [passwordVisibility, setPasswordVisibility] = useState("password");
  const [visibilityIco, setVisibilityIco] = useState(passwdHide);
  const [error, setError] = useState("");

  function changeVisibilityOfPassword(){
    if(passwordVisibility === "text"){
      setPasswordVisibility("password");
      setVisibilityIco(passwdHide);
    }else{
      setPasswordVisibility("text");
      setVisibilityIco(passwdShow);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    const data = { username: e.target.elements.username.value, password: e.target.elements.password.value };
    
    try {
      const res = await fetch('/login', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      });
      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
       setError("Błąd logowania");
      }
    } catch (err) { 
      console.error(err); 
      setError("Błąd serwera!");
    }
  }

  return <div id="mainContainer">
          <h1 id="title">Login</h1>

          <form id="mainForm" onSubmit={submit}>
            <input type="text" id="username" name="username" className="inputs" placeholder="Username"></input>
            <input type={passwordVisibility} id="password" name="password" className="inputs" placeholder="Password"></input>
            <button type="button" id="passwordVisibilityChange" onClick={changeVisibilityOfPassword}>
              <img src={visibilityIco}></img>
            </button>
            <button type="submit" id="submit">Login</button>
          </form>

          <h5 id="copyright">Copyright TeleMechanik 2025-2026©</h5>
        </div>
}