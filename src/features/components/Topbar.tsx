
import "./css/topbar.css";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";




export const Topbar = () => {
    const navigate = useNavigate();

      const handleLogout = async () => {
         await supabase.auth.signOut();
         navigate("/login", { replace: true });
     };


  return (
       <header className='topbar'>

            <div className='topbar-main'>

                <div className='topbar-brand'>
                    <p>Job Hunt</p>
                </div>

                <div className='topbar-profile'>
                    <button className='notification-btn'>
                        <span className="notification-icon">🔔</span>
                    </button>

                    <div className='profile-info'>
                        <div className='profile-avatar'></div>
                        <span className='profile-name'>username@email.com</span>
                    </div>
                </div>

            </div>

            <div className='topbar-toolbar'>
                <div className='toolbar-search'>
                    <input type='text' placeholder='Search jobs'></input>
                </div>

                <div className='toolbar-actions'>
                    <button>Add job</button>
                    <button>Add column</button>
                </div>
            </div>

            <div className="logout-btn" onClick={handleLogout}>
                <button>Logout</button>
            </div>

       </header>
    
  )
}
