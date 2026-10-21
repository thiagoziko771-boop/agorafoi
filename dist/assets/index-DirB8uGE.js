(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))i(e);new MutationObserver(e=>{for(const r of e)if(r.type==="childList")for(const t of r.addedNodes)t.tagName==="LINK"&&t.rel==="modulepreload"&&i(t)}).observe(document,{childList:!0,subtree:!0});function n(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?r.credentials="include":e.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(e){if(e.ep)return;e.ep=!0;const r=n(e);fetch(e.href,r)}})();document.getElementById("root").innerHTML=`
            <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: sans-serif; background: #f5f5f5;">
                <div style="text-align: center; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h1 style="color: #333; margin-bottom: 20px;">Agora Foi!</h1>
                    <p style="color: #666; margin-bottom: 30px; font-size: 18px;">Plataforma de Pagamento com PIX</p>
                    <button onclick="generatePix()" style="background: #007bff; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; margin: 10px;">
                        Gerar PIX
                    </button>
                    <div id="result" style="margin-top: 30px; display: none;">
                        <h3 id="resultTitle" style="color: #28a745; margin-bottom: 15px;"></h3>
                        <p id="pixCode" style="word-break: break-all; background: #f0f0f0; padding: 15px; border-radius: 5px; font-size: 14px; font-family: monospace;"></p>
                        <button onclick="copyPix()" style="background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 15px;">
                            Copiar PIX
                        </button>
                    </div>
                    <div id="error" style="margin-top: 30px; display: none; color: #dc3545; padding: 15px; background: #f8d7da; border-radius: 5px;"></div>
                </div>
            </div>
        `;window.currentPixCode=null;
