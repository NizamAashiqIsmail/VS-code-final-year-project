export const getStyles = () => `
* { box-sizing: border-box; font-family: sans-serif; }
  
  /* POSITIONED AT TOP RIGHT */
  #setup-container {
    position: fixed; 
    top: 20px; 
    right: 20px;
    z-index: 1000001;
    pointer-events: auto;
  }
  .setup-card {
    background: white; 
    width: 320px; 
    padding: 20px;
    border-radius: 12px; 
    border: 1px solid #4285f4;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    text-align: center;
    animation: cornerSlideIn 0.3s ease-out;
  }
  @keyframes cornerSlideIn { 
    from { opacity: 0; transform: translateX(50px); } 
    to { opacity: 1; transform: translateX(0); } 
  }

  .setup-header { font-weight: bold; font-size: 18px; color: #4285f4; margin-bottom: 8px; }
  .setup-card p { font-size: 13px; color: #555; line-height: 1.4; margin: 5px 0 15px 0; }
  .setup-card textarea { width: 100%; height: 70px; margin-bottom: 12px; border-radius: 8px; border: 1px solid #ddd; padding: 10px; resize: none; font-size: 13px; }
  .setup-card button { background: #4285f4; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; }
  .setup-card .btn-group { display: flex; gap: 8px; }
  .setup-card button.secondary { background: #f1f3f4; color: #555; }

  .video-preview { width: 100%; height: 160px; background: #000; border-radius: 10px; margin-bottom: 15px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
  #timer-display { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.6); color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
  #calib-video { width: 100%; height: 100%; object-fit: cover; }

  /* MAIN WIDGET STYLES */
  #widget-wrapper { position: fixed; top: 150px; right: 50px; width: 120px; height: 120px; z-index: 999999; display: flex; align-items: center; justify-content: center; user-select: none; }
  #note-box { position: absolute; right: 105px; width: 140px; height: 75px; background: white; border: 2px solid #4285f4; border-radius: 12px; padding: 10px; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 12px; color: #333; box-shadow: -4px 4px 10px rgba(0,0,0,0.1); z-index: 4; transition: transform 0.3s ease, opacity 0.3s ease; }
  #main-circle { width: 75px; height: 75px; background: #4285f4; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; cursor: move; z-index: 10; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.2); overflow: hidden; position: relative; transition: all 0.3s ease; }
  #info { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
  #popup-image { display: none; width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; }
  .menu-button { position: absolute; width: 34px; height: 34px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 1px solid #ddd; box-shadow: 0 2px 6px rgba(0,0,0,0.1); cursor: pointer; z-index: 5; transition: all 0.2s ease; }
  .minimized #main-circle { width: 40px; height: 40px; background: #34a853; }
  .minimized .menu-button, .minimized #note-box { opacity: 0 !important; pointer-events: none !important; transform: scale(0.2) translateX(50px) !important; }
  .minimized #info { display: none; }
  #settings-card { position: fixed; top: 200px; right: 50px; width: 280px; background: white; padding: 20px; border-radius: 15px; display: none; box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 1000000; }
  .settings-header { font-weight: bold; font-size: 16px; margin-bottom: 15px; color: #4285f4; border-bottom: 1px solid #eee; padding-bottom: 5px; }
  .settings-section { margin-bottom: 15px; }
  .section-title { font-size: 11px; font-weight: bold; color: #888; text-transform: uppercase; margin-bottom: 8px; }
  .setting-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-size: 12px; }
  .avatar-up { width: 130px; font-size: 10px; }
  .block-input-row { display: flex; gap: 5px; margin-bottom: 10px; }
  .block-input-row input { flex-grow: 1; padding: 5px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px; }
  #block-list-display { max-height: 100px; overflow-y: auto; font-size: 11px; }
  .block-item { display: flex; justify-content: space-between; padding: 4px; border-bottom: 1px solid #fafafa; }
  #set-back { width: 100%; background: #4285f4; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; margin-top: 10px; font-weight: bold; }
`;