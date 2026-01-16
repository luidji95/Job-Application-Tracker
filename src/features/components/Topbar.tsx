import React from 'react'
import "./css/topbar.css";

export const Topbar = () => {
  return (
       <header className='topbar'>

            <div className='topbar-main'>

                <div className='topbar-brand'>
                    <p>Job Hunt</p>
                </div>

                <div className='topbar-profile'>
                    <button className='notification-btn'>
                        <img alt='notification'></img>
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

       </header>
    
  )
}
