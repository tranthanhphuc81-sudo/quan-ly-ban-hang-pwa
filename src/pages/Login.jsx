import React, { useState } from 'react';

const LOCAL_KEY = 'app_auth';
const PASS_KEY = 'app_password';
const QUESTION_KEY = 'app_sec_question';
const ANSWER_KEY = 'app_sec_answer';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [oldPass, setOldPass] = useState('');
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [showQuestionSetup, setShowQuestionSetup] = useState(false);
  const [question, setQuestion] = useState(localStorage.getItem(QUESTION_KEY) || '');
  const [answer, setAnswer] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [questionOk, setQuestionOk] = useState(false);
  const [showSetup, setShowSetup] = useState(!localStorage.getItem(PASS_KEY));

  const isBiometricSupported = window.PublicKeyCredential !== undefined;
  const savedPass = localStorage.getItem(PASS_KEY) || '123456';
  const savedQuestion = localStorage.getItem(QUESTION_KEY);
  const savedAnswer = localStorage.getItem(ANSWER_KEY);

  const handlePasswordLogin = e => {
    e.preventDefault();
    if (password === savedPass) {
      localStorage.setItem(LOCAL_KEY, 'ok');
      onLogin();
    } else {
      setError('Sai mật khẩu!');
    }
  };

  const handleBiometricLogin = async () => {
    if (!isBiometricSupported) {
      setError('Thiết bị không hỗ trợ sinh học!');
      return;
    }
    try {
      const cred = await navigator.credentials.get({ publicKey: {
        challenge: new Uint8Array([1,2,3,4]),
        timeout: 60000,
        userVerification: 'preferred',
      }});
      if (cred) {
        localStorage.setItem(LOCAL_KEY, 'ok');
        onLogin();
      } else {
        setError('Không nhận diện được!');
      }
    } catch (e) {
      setError('Thiết bị không hỗ trợ hoặc chưa đăng ký sinh học!');
    }
  };

  const handleBiometricVerify = async () => {
    if (!isBiometricSupported) {
      setError('Thiết bị không hỗ trợ sinh học!');
      return;
    }
    try {
      const cred = await navigator.credentials.get({ publicKey: {
        challenge: new Uint8Array([5,6,7,8]),
        timeout: 60000,
        userVerification: 'preferred',
      }});
      if (cred) {
        setBiometricVerified(true);
        setError('');
      } else {
        setError('Không nhận diện được!');
      }
    } catch (e) {
      setError('Thiết bị không hỗ trợ hoặc chưa đăng ký sinh học!');
    }
  };

  const handleQuestionSetup = e => {
    e.preventDefault();
    if (!question || !answer) {
      setError('Vui lòng nhập câu hỏi và đáp án!');
      return;
    }
    localStorage.setItem(QUESTION_KEY, question);
    localStorage.setItem(ANSWER_KEY, answer.trim().toLowerCase());
    setShowQuestionSetup(false);
    setError('Đã lưu câu hỏi bảo mật!');
  };

  const handleCheckQuestion = e => {
    e.preventDefault();
    if (userAnswer.trim().toLowerCase() === (savedAnswer || '').trim().toLowerCase()) {
      setQuestionOk(true);
      setError('');
    } else {
      setError('Đáp án không đúng!');
    }
  };

  const handleResetPassword = e => {
    e.preventDefault();
    if (!biometricVerified && oldPass !== savedPass && !questionOk) {
      setError('Xác nhận mật khẩu cũ, sinh học hoặc câu hỏi bảo mật!');
      return;
    }
    if (!newPass || newPass.length < 4) {
      setError('Mật khẩu mới phải từ 4 ký tự!');
      return;
    }
    if (newPass !== confirmPass) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }
    localStorage.setItem(PASS_KEY, newPass);
    setError('Đặt lại mật khẩu thành công!');
    setShowReset(false);
    setPassword('');
    setNewPass('');
    setConfirmPass('');
    setOldPass('');
    setBiometricVerified(false);
    setUserAnswer('');
    setQuestionOk(false);
  };

  const handleSetupPassword = e => {
    e.preventDefault();
    if (!newPass || newPass.length < 4) {
      setError('Mật khẩu phải từ 4 ký tự!');
      return;
    }
    if (newPass !== confirmPass) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }
    localStorage.setItem(PASS_KEY, newPass);
    setShowSetup(false);
    setError('Thiết lập mật khẩu thành công!');
    setPassword('');
    setNewPass('');
    setConfirmPass('');
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(120deg,#e0eaff 0%,#f8fcff 100%)'}}>
      <div style={{width:'100%',maxWidth:400,padding:'32px 24px',borderRadius:'18px',boxShadow:'0 4px 24px rgba(80,120,255,0.10)',background:'#fff',margin:'32px 0',boxSizing:'border-box'}}>
        <h2 style={{textAlign:'center',fontWeight:700,fontSize:'1.7rem',color:'#3578e5',marginBottom:24,letterSpacing:'0.5px'}}>Đăng nhập</h2>
        {showSetup ? (
          <form onSubmit={handleSetupPassword} style={{display:'flex',flexDirection:'column',gap:16}}>
            <div className="field" style={{marginBottom:0}}>
              <label className="label" style={{fontWeight:500}}>Thiết lập mật khẩu ban đầu</label>
              <div className="control" style={{width:'100%'}}>
                <input className="input" style={{borderRadius:8,width:'100%',boxSizing:'border-box'}} type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Nhập mật khẩu mới..." />
              </div>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label className="label" style={{fontWeight:500}}>Xác nhận mật khẩu</label>
              <div className="control" style={{width:'100%'}}>
                <input className="input" style={{borderRadius:8,width:'100%',boxSizing:'border-box'}} type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Nhập lại mật khẩu..." />
              </div>
            </div>
            <button className="button is-success is-fullwidth" style={{marginTop:4,borderRadius:8}} type="submit">Thiết lập mật khẩu</button>
          </form>
        ) : !showReset && !showQuestionSetup ? (
          <>
            <form onSubmit={handlePasswordLogin} style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="field" style={{marginBottom:0}}>
                <label className="label" style={{fontWeight:500}}>Mật khẩu</label>
                <div className="control" style={{width:'100%'}}>
                  <input className="input" style={{borderRadius:8,width:'100%',boxSizing:'border-box'}} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Nhập mật khẩu..." />
                </div>
              </div>
              <button className="button is-primary is-fullwidth" style={{marginTop:4,borderRadius:8}} type="submit">Đăng nhập bằng mật khẩu</button>
            </form>
            <div style={{display:'flex',justifyContent:'center',margin:'16px 0 8px 0',gap:8}}>
              <button className="button is-text" style={{fontSize:'1rem'}} onClick={()=>setShowReset(true)}>Quên mật khẩu?</button>
              <button className="button is-text" style={{fontSize:'1rem'}} onClick={()=>setShowQuestionSetup(true)}>Thiết lập câu hỏi bảo mật</button>
            </div>
            <div style={{textAlign:'center',marginBottom:8,color:'#aaa'}}>hoặc</div>
            <button className="button is-link is-fullwidth" style={{borderRadius:8}} onClick={handleBiometricLogin} disabled={!isBiometricSupported}>
              Đăng nhập bằng sinh học
            </button>
          </>
        ) : showQuestionSetup ? (
          <form onSubmit={handleQuestionSetup} style={{display:'flex',flexDirection:'column',gap:16}}>
            <div className="field" style={{marginBottom:0}}>
              <label className="label" style={{fontWeight:500}}>Câu hỏi bảo mật</label>
              <div className="control" style={{width:'100%'}}>
                <input className="input" style={{borderRadius:8,width:'100%',boxSizing:'border-box'}} type="text" value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ví dụ: Tên thú cưng của bạn?" />
              </div>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label className="label" style={{fontWeight:500}}>Đáp án</label>
              <div className="control" style={{width:'100%'}}>
                <input className="input" style={{borderRadius:8,width:'100%',boxSizing:'border-box'}} type="text" value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Nhập đáp án..." />
              </div>
            </div>
            <button className="button is-success is-fullwidth" style={{marginTop:4,borderRadius:8}} type="submit">Lưu câu hỏi</button>
            <button className="button is-text is-fullwidth" style={{marginTop:8}} type="button" onClick={()=>setShowQuestionSetup(false)}>Quay lại đăng nhập</button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={{display:'flex',flexDirection:'column',gap:16}}>
            <div className="field" style={{marginBottom:0}}>
              <label className="label" style={{fontWeight:500}}>Xác nhận mật khẩu cũ, sinh học hoặc câu hỏi bảo mật</label>
              <div className="control" style={{width:'100%'}}>
                <input className="input" style={{borderRadius:8,width:'100%',boxSizing:'border-box'}} type="password" value={oldPass} onChange={e=>setOldPass(e.target.value)} placeholder="Nhập mật khẩu cũ..." disabled={biometricVerified || questionOk} />
              </div>
              <button className="button is-link is-fullwidth" style={{marginTop:8,borderRadius:8}} type="button" onClick={handleBiometricVerify} disabled={biometricVerified || !isBiometricSupported}>Xác nhận bằng sinh học</button>
              {biometricVerified && <span className="tag is-success ml-2">Đã xác thực sinh học</span>}
              {savedQuestion && !questionOk && (
                <div className="mt-2">
                  <label className="label" style={{fontWeight:500}}>Hoặc trả lời câu hỏi bảo mật:</label>
                  <div className="control" style={{width:'100%'}}>
                    <input className="input" style={{borderRadius:8,width:'100%',boxSizing:'border-box'}} type="text" value={userAnswer} onChange={e=>setUserAnswer(e.target.value)} placeholder={savedQuestion} />
                  </div>
                  <button className="button is-info is-fullwidth" style={{marginTop:8,borderRadius:8}} type="button" onClick={handleCheckQuestion}>Xác nhận đáp án</button>
                  {questionOk && <span className="tag is-success ml-2">Đã xác thực câu hỏi</span>}
                </div>
              )}
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label className="label" style={{fontWeight:500}}>Mật khẩu mới</label>
              <div className="control" style={{width:'100%'}}>
                <input className="input" style={{borderRadius:8,width:'100%',boxSizing:'border-box'}} type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Nhập mật khẩu mới..." />
              </div>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label className="label" style={{fontWeight:500}}>Xác nhận mật khẩu</label>
              <div className="control" style={{width:'100%'}}>
                <input className="input" style={{borderRadius:8,width:'100%',boxSizing:'border-box'}} type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Nhập lại mật khẩu..." />
              </div>
            </div>
            <button className="button is-success is-fullwidth" style={{marginTop:4,borderRadius:8}} type="submit">Đặt lại mật khẩu</button>
            <button className="button is-text is-fullwidth" style={{marginTop:8}} type="button" onClick={()=>{setShowReset(false);setBiometricVerified(false);setOldPass('');setUserAnswer('');setQuestionOk(false);}}>Quay lại đăng nhập</button>
          </form>
        )}
        {error && <div className="notification is-danger mt-3" style={{borderRadius:8,textAlign:'center'}}>{error}</div>}
      </div>
    </div>
  );
}
