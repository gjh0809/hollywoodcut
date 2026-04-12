import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Upload, Key, RefreshCw, Image as ImageIcon, Settings, Wand2, Edit3, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function getPromptText(movie, ratio, dof) {
  return `【人物与面容】
核心人物： 以上传图片为唯一面部参考，100%精确重构该人物的面部骨骼结构、皮肤纹理、发型及神态...
${movie || '[INSERT MOVIE NAME HERE]'}主演： 呈现其于电影拍摄期间的样貌...
互动状态： 两人身着各自的戏服，在电影拍摄间隙...

【镜头与构图】
镜头： 专业人像摄影机模式拍摄... ${dof}
构图： ${ratio} 采用生活化、不拘谨的抓拍构图...

【灯光与色彩】
主光源： 完全遵循所选电影场景的环境光逻辑...
色彩风格： 电影风格的色调...

【服装与造型】
上传人物着装： 保持不变...
${movie || '[INSERT MOVIE NAME HERE]'}主演着装： 符合剧中时代与角色...

【动作与场景】
核心动作： 电影拍摄被短暂打断...
关键元素： 画面中需明确可见电影拍摄现场的痕迹（摄影机、灯光架、麦克风杆等）...

【画面风格与细节】
细节： 模拟柯达Vision3 500T电影胶片质感，带有自然的银盐颗粒感...
画面氛围： 温暖、怀旧、充满人情味...

【最终画面感受总结】
一张超写实的照片，仿佛闯入了拍摄现场...`;
}

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('gemini_api_key'));
  const [tempKey, setTempKey] = useState('');
  
  // Controls state
  const [image, setImage] = useState(null); // base64
  const [movie, setMovie] = useState('');
  const [ratio, setRatio] = useState('16:9');
  const [dof, setDof] = useState('f/1.2');
  const [prompt, setPrompt] = useState('');
  
  // Monitor state
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [resultImage, setResultImage] = useState(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [posterImage, setPosterImage] = useState(null);

  const fileInputRef = useRef(null);

  const handleKeySubmit = (e) => {
    e.preventDefault();
    if(tempKey.trim()) {
      localStorage.setItem('gemini_api_key', tempKey.trim());
      setApiKey(tempKey.trim());
      setIsAuth(true);
    }
  };

  const handleResetKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setIsAuth(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const onGeneratePrompt = () => {
    setPrompt(getPromptText(movie, ratio, dof));
  };

  const generatePhoto = async () => {
    if (!prompt || !image) {
       alert('请提供图片和提示词');
       return;
    }
    setStatus('loading');
    try {
       const { GoogleGenAI } = await import('@google/genai');
       const ai = new GoogleGenAI({ apiKey });
       const base64Data = image.split(',')[1];
       const mimeType = image.split(';')[0].split(':')[1];

       const response = await ai.models.generateContent({
           model: 'gemini-3-pro-image-preview',
           contents: [
               {
                   role: 'user',
                   parts: [
                       { text: prompt },
                       { inlineData: { data: base64Data, mimeType } }
                   ]
               }
           ]
       });
       
       let outputImg = null;
       try {
           outputImg = response.candidates[0].content.parts[0].inlineData.data;
           if(outputImg) setResultImage(`data:image/jpeg;base64,${outputImg}`);
       } catch (e) {
           console.log('Error parsing response, falling back reading text', e);
           alert('未收到图片数据部分');
       }
       setStatus('success');
    } catch (error) {
       console.error(error);
       alert('生成失败: ' + error.message);
       setStatus('error');
    }
  };

  const generatePoster = async () => {
     if(!movie) return;
     try {
       const { GoogleGenAI } = await import('@google/genai');
       const ai = new GoogleGenAI({ apiKey });
       const response = await ai.models.generateContent({
           model: 'gemini-2.5-flash-image',
           contents: [{ role: 'user', parts: [{ text: `Generate a minimalist movie poster impression for the movie: ${movie}` }] }]
       });
       let outputImg = response.candidates[0].content.parts[0].inlineData?.data;
       if(outputImg) setPosterImage(`data:image/jpeg;base64,${outputImg}`);
     } catch (e) {
       console.error('Poster generation failed', e);
     }
  };

  const editPhoto = async () => {
    if (!resultImage || !editPrompt) return;
    setStatus('loading');
    try {
       const { GoogleGenAI } = await import('@google/genai');
       const ai = new GoogleGenAI({ apiKey });
       const base64Data = resultImage.split(',')[1];
       const mimeType = 'image/jpeg';
       const response = await ai.models.generateContent({
           model: 'gemini-2.5-flash-image',
           contents: [
               {
                   role: 'user',
                   parts: [
                       { text: editPrompt },
                       { inlineData: { data: base64Data, mimeType } }
                   ]
               }
           ]
       });
       let outputImg = response.candidates[0].content.parts[0].inlineData?.data;
       if(outputImg) setResultImage(`data:image/jpeg;base64,${outputImg}`);
       setStatus('success');
    } catch (e) {
       console.error(e);
       alert('修改失败: ' + e.message);
       setStatus('error');
    }
  }

  if (!isAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-100">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 border border-neutral-200 shadow-sm w-full max-w-md">
          <div className="flex justify-center mb-6"><Wand2 className="w-10 h-10 text-neutral-800" /></div>
          <h1 className="text-2xl font-medium text-center mb-6 text-neutral-800">Hollywood Cut</h1>
          <form onSubmit={handleKeySubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-600 mb-2">Google Gemini API Key</label>
              <input type="password" required className="w-full border-neutral-300 border px-3 py-2 focus:ring-black focus:border-black outline-none transition-colors" value={tempKey} onChange={e=>setTempKey(e.target.value)} placeholder="AIzaSy..." />
            </div>
            <button type="submit" className="w-full bg-neutral-900 text-white py-2.5 font-medium hover:bg-neutral-800 transition-colors">进入工作室</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
      {posterImage && (
         <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-cover bg-center" style={{ backgroundImage: `url(${posterImage})` }} />
      )}
      
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm z-10 sticky top-0 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Wand2 className="w-5 h-5 text-neutral-800" />
          <h1 className="text-lg font-medium tracking-tight">Hollywood Cut</h1>
        </div>
        <button onClick={handleResetKey} className="text-sm flex items-center text-neutral-500 hover:text-neutral-800 transition-colors">
          <RefreshCw className="w-4 h-4 mr-1" /> 重置 Key
        </button>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 z-10">
        <section className="space-y-8 h-full flex flex-col">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4 flex items-center"><ImageIcon className="w-4 h-4 mr-2"/> 面部参考图</h2>
            <div className="border border-dashed border-neutral-300 bg-neutral-50 hover:bg-neutral-100 transition-colors p-6 flex flex-col items-center justify-center cursor-pointer min-h-[160px]" onClick={() => fileInputRef.current?.click()}>
              {image ? (
                <img src={image} alt="Reference" className="max-h-40 object-contain shadow-sm border border-neutral-200" />
              ) : (
                <div className="text-center text-neutral-500">
                  <Upload className="w-6 h-6 mx-auto mb-2 text-neutral-400" />
                  <p className="text-sm">点击或拖拽上传人像图片</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
          </div>

          <div>
             <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4 flex items-center"><Settings className="w-4 h-4 mr-2"/> 场景参数</h2>
             <div className="space-y-4 bg-neutral-50 p-5 border border-neutral-200 shadow-sm">
                <div>
                   <label className="block text-sm text-neutral-700 mb-1">电影名称</label>
                   <input type="text" className="w-full border-neutral-300 border px-3 py-2 outline-none focus:border-neutral-500 bg-white" placeholder="例如: 繁花 / 霸王别姬" value={movie} onChange={e=>setMovie(e.target.value)} onBlur={generatePoster} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-700 mb-1">画幅比例</label>
                    <select className="w-full border-neutral-300 border px-3 py-2 outline-none focus:border-neutral-500 bg-white" value={ratio} onChange={e=>setRatio(e.target.value)}>
                       <option value="16:9">16:9 (横屏电影)</option>
                       <option value="9:16">9:16 (竖屏视频)</option>
                       <option value="3:4">3:4 (经典胶片)</option>
                       <option value="4:3">4:3 (老式电视)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-700 mb-1">镜头景深</label>
                    <select className="w-full border-neutral-300 border px-3 py-2 outline-none focus:border-neutral-500 bg-white" value={dof} onChange={e=>setDof(e.target.value)}>
                       <option value="f/1.2">f/1.2 (极浅景深, 人物极度突出)</option>
                       <option value="f/4">f/4 (适中景深, 兼顾环境)</option>
                       <option value="f/11">f/11 (深景深, 环境全清晰)</option>
                    </select>
                  </div>
                </div>
             </div>
          </div>

          <div className="flex-1 flex flex-col">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 flex items-center"><Edit3 className="w-4 h-4 mr-2"/> 导演提示词</h2>
                <button onClick={onGeneratePrompt} className="text-xs border border-neutral-300 px-3 py-1 hover:bg-neutral-100 transition-colors text-neutral-700 font-medium">生成模板</button>
             </div>
             <textarea className="flex-1 min-h-[220px] w-full border border-neutral-300 p-4 text-sm outline-none focus:border-neutral-500 resize-none bg-neutral-50 shadow-inner" placeholder="在此验证您的 Prompt..." value={prompt} onChange={e=>setPrompt(e.target.value)}></textarea>
          </div>

          <button onClick={generatePhoto} disabled={status === 'loading'} className={"w-full py-4 flex justify-center items-center font-medium transition-colors shadow-sm " + (status==='loading' ? "bg-neutral-300 text-neutral-500 cursor-not-allowed" : "bg-neutral-900 text-white hover:bg-neutral-800")}>
             {status === 'loading' ? <><Loader2 className="w-5 h-5 mr-2 animate-spin"/> 生成中...</> : "开始生成 (Action!)"}
          </button>
        </section>

        <section className="bg-neutral-50 border border-neutral-200 flex flex-col shadow-sm min-h-[600px]">
           <div className="bg-neutral-900 text-neutral-300 text-[10px] px-4 py-2 flex justify-between uppercase tracking-widest border-b border-black">
              <span>Preview Monitor</span>
              <span>{ratio} • {dof}</span>
           </div>
           
           <div className="flex-1 relative flex items-center justify-center p-6 border-b border-neutral-200">
              <AnimatePresence mode="wait">
                {status === 'idle' && !resultImage && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-neutral-400 flex flex-col items-center">
                     <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                     <p className="text-sm font-medium">等待生成信号</p>
                  </motion.div>
                )}
                {status === 'loading' && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-neutral-500 flex flex-col items-center">
                     <Loader2 className="w-10 h-10 mb-4 animate-spin" />
                     <p className="animate-pulse text-sm font-medium">RENDERING...</p>
                  </motion.div>
                )}
                {resultImage && status !== 'loading' && (
                  <motion.div key="result" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full flex flex-col">
                     <div className="flex-1 flex items-center justify-center bg-neutral-200 overflow-hidden shadow-inner border border-neutral-300">
                        <img src={resultImage} alt="Result" className="max-w-full max-h-full object-contain" />
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>

           {resultImage && status !== 'loading' && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5">
               <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">后期修图 (Post Edit)</h3>
               <div className="flex space-x-3">
                 <input type="text" value={editPrompt} onChange={e=>setEditPrompt(e.target.value)} className="flex-1 border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-500" placeholder="例如：增加冷色调..." />
                 <button onClick={editPhoto} className="bg-neutral-800 hover:bg-neutral-900 text-white px-5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shadow-sm">应用微调</button>
               </div>
             </motion.div>
           )}
        </section>
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
