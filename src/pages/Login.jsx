import React, { useState } from 'react';

const LOCAL_KEY = 'app_auth';
const PASS_KEY = 'app_password';
const QUESTION_KEY = 'app_sec_question';
const ANSWER_KEY = 'app_sec_answer';
const BIOMETRIC_KEY = 'app_biometric_registered';
const CREDENTIAL_ID_KEY = 'app_credential_id';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [oldPass, setOldPass] = useState('');
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [showQuestionSetup, setShowQuestionSetup] = useState(false);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [setupPassword, setSetupPassword] = useState('');
  const [question, setQuestion] = useState(localStorage.getItem(QUESTION_KEY) || '');
  const [answer, setAnswer] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [questionOk, setQuestionOk] = useState(false);
  const [showSetup, setShowSetup] = useState(!localStorage.getItem(PASS_KEY));

  const isBiometricSupported = window.PublicKeyCredential !== undefined;
  const isBiometricRegistered = localStorage.getItem(BIOMETRIC_KEY) === 'true';
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

  const handleBiometricSetup = async (e) => {
    e.preventDefault();
    if (!isBiometricSupported) {
      setError('Thiết bị không hỗ trợ sinh trắc học!');
      return;
    }
    if (setupPassword !== savedPass) {
      setError('Mật khẩu không đúng!');
      return;
    }
    try {
      // Tạo credential mới với cấu hình đầy đủ
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      
      const userId = new Uint8Array(16);
      crypto.getRandomValues(userId);
      
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challenge,
          rp: {
            name: "Quản lý bán hàng",
            id: window.location.hostname
          },
          user: {
            id: userId,
            name: "user@app.local",
            displayName: "User"
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },  // ES256
            { alg: -257, type: "public-key" } // RS256
          ],
          timeout: 60000,
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "preferred",
            requireResidentKey: false
          },
          attestation: "none"
        }
      });
      
      if (credential) {
        // Lưu credential ID để dùng khi đăng nhập
        const credIdArray = Array.from(new Uint8Array(credential.rawId));
        localStorage.setItem(CREDENTIAL_ID_KEY, JSON.stringify(credIdArray));
        localStorage.setItem(BIOMETRIC_KEY, 'true');
        setError('Đăng ký sinh trắc học thành công!');
        setShowBiometricSetup(false);
        setSetupPassword('');
      } else {
        setError('Không thể đăng ký sinh trắc học!');
      }
    } catch (e) {
      console.error('Biometric setup error:', e);
      if (e.name === 'NotAllowedError') {
        setError('Bạn đã từ chối đăng ký sinh trắc học!');
      } else if (e.name === 'InvalidStateError') {
        setError('Sinh trắc học đã được đăng ký trước đó!');
      } else {
        setError('Lỗi đăng ký: ' + e.message);
      }
    }
  };

  const handleBiometricLogin = async () => {
    if (!isBiometricSupported) {
      setError('Thiết bị không hỗ trợ sinh trắc học!');
      return;
    }
    if (!isBiometricRegistered) {
      setError('Vui lòng đăng ký sinh trắc học trước!');
      return;
    }
    
    try {
      // Lấy credential ID đã lưu
      const savedCredId = localStorage.getItem(CREDENTIAL_ID_KEY);
      if (!savedCredId) {
        setError('Không tìm thấy thông tin đăng ký. Vui lòng đăng ký lại!');
        return;
      }
      
      const credIdArray = JSON.parse(savedCredId);
      const credId = new Uint8Array(credIdArray);
      
      // Tạo challenge mới
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      
      const cred = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          rpId: window.location.hostname,
          allowCredentials: [{
            type: 'public-key',
            id: credId,
            transports: ['internal']
          }],
          timeout: 60000,
          userVerification: 'preferred'
        }
      });
      
      if (cred) {
        localStorage.setItem(LOCAL_KEY, 'ok');
        onLogin();
      } else {
        setError('Không nhận diện được!');
      }
    } catch (e) {
      console.error('Biometric login error:', e);
      if (e.name === 'NotAllowedError') {
        setError('Bạn đã từ chối xác thực sinh trắc học!');
      } else if (e.name === 'InvalidStateError') {
        setError('Vui lòng đăng ký lại sinh trắc học!');
      } else {
        setError('Lỗi xác thực: ' + e.message);
      }
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
    <div style={{
      minHeight:'100vh',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        width:'100%',
        maxWidth:420,
        padding:'40px 32px',
        borderRadius:'24px',
        boxShadow:'0 12px 48px rgba(102, 126, 234, 0.25)',
        background:'rgba(255, 255, 255, 0.95)',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
        border:'1px solid rgba(255, 255, 255, 0.3)',
        boxSizing:'border-box'
      }}>
        <h2 style={{
          textAlign:'center',
          fontWeight:700,
          fontSize:'2rem',
          background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip:'text',
          WebkitTextFillColor:'transparent',
          backgroundClip:'text',
          marginBottom:32,
          letterSpacing:'0.5px'
        }}>Đăng nhập</h2>
        {showSetup ? (
          <form onSubmit={handleSetupPassword} style={{display:'flex',flexDirection:'column',gap:20}}>
            <div style={{marginBottom:0}}>
              <label style={{display:'block',fontWeight:600,fontSize:'0.95rem',color:'#4a5568',marginBottom:8}}>Thiết lập mật khẩu ban đầu</label>
              <input
                style={{
                  width:'100%',
                  padding:'14px 16px',
                  borderRadius:12,
                  border:'2px solid #e2e8f0',
                  fontSize:'1rem',
                  transition:'all 0.25s ease',
                  outline:'none',
                  boxSizing:'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                type="password"
                value={newPass}
                onChange={e=>setNewPass(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
              />
            </div>
            <div style={{marginBottom:0}}>
              <label style={{display:'block',fontWeight:600,fontSize:'0.95rem',color:'#4a5568',marginBottom:8}}>Xác nhận mật khẩu</label>
              <input
                style={{
                  width:'100%',
                  padding:'14px 16px',
                  borderRadius:12,
                  border:'2px solid #e2e8f0',
                  fontSize:'1rem',
                  transition:'all 0.25s ease',
                  outline:'none',
                  boxSizing:'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                type="password"
                value={confirmPass}
                onChange={e=>setConfirmPass(e.target.value)}
                placeholder="Nhập lại mật khẩu..."
              />
            </div>
            <button
              style={{
                width:'100%',
                padding:'14px 20px',
                borderRadius:12,
                border:'none',
                background:'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color:'white',
                fontSize:'1rem',
                fontWeight:600,
                cursor:'pointer',
                transition:'all 0.25s ease',
                boxShadow:'0 4px 12px rgba(16, 185, 129, 0.3)',
                marginTop:8
              }}
              onMouseEnter={(e) => {e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'}}
              onMouseLeave={(e) => {e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'}}
              type="submit"
            >
              Thiết lập mật khẩu
            </button>
          </form>
        ) : !showReset && !showQuestionSetup ? (
          <>
            <form onSubmit={handlePasswordLogin} style={{display:'flex',flexDirection:'column',gap:20}}>
              <div style={{marginBottom:0}}>
                <label style={{display:'block',fontWeight:600,fontSize:'0.95rem',color:'#4a5568',marginBottom:8}}>Mật khẩu</label>
                <input
                  style={{
                    width:'100%',
                    padding:'14px 16px',
                    borderRadius:12,
                    border:'2px solid #e2e8f0',
                    fontSize:'1rem',
                    transition:'all 0.25s ease',
                    outline:'none',
                    boxSizing:'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  type="password"
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                />
              </div>
              <button
                style={{
                  width:'100%',
                  padding:'14px 20px',
                  borderRadius:12,
                  border:'none',
                  background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color:'white',
                  fontSize:'1rem',
                  fontWeight:600,
                  cursor:'pointer',
                  transition:'all 0.25s ease',
                  boxShadow:'0 4px 12px rgba(102, 126, 234, 0.3)',
                  marginTop:8
                }}
                onMouseEnter={(e) => {e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)'}}
                onMouseLeave={(e) => {e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'}}
                type="submit"
              >
                Đăng nhập bằng mật khẩu
              </button>
            </form>
            <div style={{display:'flex',justifyContent:'center',margin:'20px 0 16px 0',gap:16,flexWrap:'wrap'}}>
              <button
                style={{
                  background:'none',
                  border:'none',
                  color:'#667eea',
                  fontSize:'0.95rem',
                  fontWeight:600,
                  cursor:'pointer',
                  padding:'8px 12px',
                  borderRadius:8,
                  transition:'all 0.25s ease'
                }}
                onMouseEnter={(e) => {e.target.style.background = 'rgba(102, 126, 234, 0.1)'}}
                onMouseLeave={(e) => {e.target.style.background = 'none'}}
                onClick={()=>setShowReset(true)}
              >
                Quên mật khẩu?
              </button>
              <button
                style={{
                  background:'none',
                  border:'none',
                  color:'#667eea',
                  fontSize:'0.95rem',
                  fontWeight:600,
                  cursor:'pointer',
                  padding:'8px 12px',
                  borderRadius:8,
                  transition:'all 0.25s ease'
                }}
                onMouseEnter={(e) => {e.target.style.background = 'rgba(102, 126, 234, 0.1)'}}
                onMouseLeave={(e) => {e.target.style.background = 'none'}}
                onClick={()=>setShowQuestionSetup(true)}
              >
                Thiết lập câu hỏi bảo mật
              </button>
              {isBiometricSupported && (
                <button
                  style={{
                    background:'none',
                    border:'none',
                    color:isBiometricRegistered ? '#10b981' : '#667eea',
                    fontSize:'0.95rem',
                    fontWeight:600,
                    cursor:'pointer',
                    padding:'8px 12px',
                    borderRadius:8,
                    transition:'all 0.25s ease'
                  }}
                  onMouseEnter={(e) => {e.target.style.background = isBiometricRegistered ? 'rgba(16, 185, 129, 0.1)' : 'rgba(102, 126, 234, 0.1)'}}
                  onMouseLeave={(e) => {e.target.style.background = 'none'}}
                  onClick={()=>setShowBiometricSetup(true)}
                >
                  {isBiometricRegistered ? '✓ ' : ''}Thiết lập sinh trắc học
                </button>
              )}
            </div>
            <div style={{
              textAlign:'center',
              margin:'16px 0',
              color:'#a0aec0',
              fontSize:'0.9rem',
              fontWeight:500,
              position:'relative',
              display:'flex',
              alignItems:'center',
              gap:12
            }}>
              <div style={{flex:1,height:1,background:'#e2e8f0'}}></div>
              <span>hoặc</span>
              <div style={{flex:1,height:1,background:'#e2e8f0'}}></div>
            </div>
            <button
              style={{
                width:'100%',
                padding:'14px 20px',
                borderRadius:12,
                border:'2px solid #667eea',
                background:'white',
                color:'#667eea',
                fontSize:'1rem',
                fontWeight:600,
                cursor:isBiometricSupported ? 'pointer' : 'not-allowed',
                transition:'all 0.25s ease',
                opacity:isBiometricSupported ? 1 : 0.5
              }}
              onMouseEnter={(e) => {if(isBiometricSupported){e.target.style.background = '#667eea'; e.target.style.color = 'white'}}}
              onMouseLeave={(e) => {if(isBiometricSupported){e.target.style.background = 'white'; e.target.style.color = '#667eea'}}}
              onClick={handleBiometricLogin}
              disabled={!isBiometricSupported || !isBiometricRegistered}
            >
              🔐 Đăng nhập bằng sinh trắc học
            </button>
            {isBiometricSupported && !isBiometricRegistered && (
              <div style={{
                marginTop:12,
                padding:'12px 16px',
                borderRadius:10,
                background:'#fef3c7',
                border:'2px solid #fbbf24',
                color:'#92400e',
                fontSize:'0.9rem',
                fontWeight:500,
                textAlign:'center'
              }}>
                ⚠️ Chưa đăng ký sinh trắc học. Vui lòng thiết lập trước khi đăng nhập.
              </div>
            )}
          </>
        ) : showBiometricSetup ? (
          <form onSubmit={handleBiometricSetup} style={{display:'flex',flexDirection:'column',gap:20}}>
            <div style={{
              padding:'16px 20px',
              background:'#eff6ff',
              borderRadius:12,
              border:'2px solid #3b82f6',
              marginBottom:8
            }}>
              <div style={{fontSize:'1.1rem',fontWeight:700,color:'#1e40af',marginBottom:8}}>
                🔐 Đăng ký sinh trắc học
              </div>
              <div style={{fontSize:'0.9rem',color:'#1e40af',lineHeight:1.6}}>
                {isBiometricRegistered 
                  ? 'Bạn đã đăng ký sinh trắc học. Có thể đăng ký lại để cập nhật.'
                  : 'Đăng ký sinh trắc học để đăng nhập nhanh chóng và an toàn hơn.'}
              </div>
            </div>
            <div style={{marginBottom:0}}>
              <label style={{display:'block',fontWeight:600,fontSize:'0.95rem',color:'#4a5568',marginBottom:8}}>Xác nhận mật khẩu hiện tại</label>
              <input
                style={{
                  width:'100%',
                  padding:'14px 16px',
                  borderRadius:12,
                  border:'2px solid #e2e8f0',
                  fontSize:'1rem',
                  transition:'all 0.25s ease',
                  outline:'none',
                  boxSizing:'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                type="password"
                value={setupPassword}
                onChange={e=>setSetupPassword(e.target.value)}
                placeholder="Nhập mật khẩu để xác nhận..."
              />
            </div>
            <button
              style={{
                width:'100%',
                padding:'14px 20px',
                borderRadius:12,
                border:'none',
                background:'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color:'white',
                fontSize:'1rem',
                fontWeight:600,
                cursor:'pointer',
                transition:'all 0.25s ease',
                boxShadow:'0 4px 12px rgba(59, 130, 246, 0.3)',
                marginTop:8
              }}
              onMouseEnter={(e) => {e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'}}
              onMouseLeave={(e) => {e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'}}
              type="submit"
            >
              🔐 Đăng ký sinh trắc học
            </button>
            <button
              style={{
                width:'100%',
                padding:'12px 20px',
                borderRadius:12,
                border:'none',
                background:'transparent',
                color:'#667eea',
                fontSize:'0.95rem',
                fontWeight:600,
                cursor:'pointer',
                transition:'all 0.25s ease'
              }}
              onMouseEnter={(e) => {e.target.style.background = 'rgba(102, 126, 234, 0.1)'}}
              onMouseLeave={(e) => {e.target.style.background = 'transparent'}}
              type="button"
              onClick={()=>{setShowBiometricSetup(false);setSetupPassword('');}}
            >
              ← Quay lại đăng nhập
            </button>
          </form>
        ) : showQuestionSetup ? (
          <form onSubmit={handleQuestionSetup} style={{display:'flex',flexDirection:'column',gap:20}}>
            <div style={{marginBottom:0}}>
              <label style={{display:'block',fontWeight:600,fontSize:'0.95rem',color:'#4a5568',marginBottom:8}}>Câu hỏi bảo mật</label>
              <input
                style={{
                  width:'100%',
                  padding:'14px 16px',
                  borderRadius:12,
                  border:'2px solid #e2e8f0',
                  fontSize:'1rem',
                  transition:'all 0.25s ease',
                  outline:'none',
                  boxSizing:'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                type="text"
                value={question}
                onChange={e=>setQuestion(e.target.value)}
                placeholder="Ví dụ: Tên thú cưng của bạn?"
              />
            </div>
            <div style={{marginBottom:0}}>
              <label style={{display:'block',fontWeight:600,fontSize:'0.95rem',color:'#4a5568',marginBottom:8}}>Đáp án</label>
              <input
                style={{
                  width:'100%',
                  padding:'14px 16px',
                  borderRadius:12,
                  border:'2px solid #e2e8f0',
                  fontSize:'1rem',
                  transition:'all 0.25s ease',
                  outline:'none',
                  boxSizing:'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                type="text"
                value={answer}
                onChange={e=>setAnswer(e.target.value)}
                placeholder="Nhập đáp án..."
              />
            </div>
            <button
              style={{
                width:'100%',
                padding:'14px 20px',
                borderRadius:12,
                border:'none',
                background:'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color:'white',
                fontSize:'1rem',
                fontWeight:600,
                cursor:'pointer',
                transition:'all 0.25s ease',
                boxShadow:'0 4px 12px rgba(16, 185, 129, 0.3)',
                marginTop:8
              }}
              onMouseEnter={(e) => {e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'}}
              onMouseLeave={(e) => {e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'}}
              type="submit"
            >
              Lưu câu hỏi
            </button>
            <button
              style={{
                width:'100%',
                padding:'12px 20px',
                borderRadius:12,
                border:'none',
                background:'transparent',
                color:'#667eea',
                fontSize:'0.95rem',
                fontWeight:600,
                cursor:'pointer',
                transition:'all 0.25s ease'
              }}
              onMouseEnter={(e) => {e.target.style.background = 'rgba(102, 126, 234, 0.1)'}}
              onMouseLeave={(e) => {e.target.style.background = 'transparent'}}
              type="button"
              onClick={()=>setShowQuestionSetup(false)}
            >
              ← Quay lại đăng nhập
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={{display:'flex',flexDirection:'column',gap:20}}>
            <div style={{marginBottom:0}}>
              <label style={{display:'block',fontWeight:600,fontSize:'0.95rem',color:'#4a5568',marginBottom:8}}>Xác nhận mật khẩu cũ</label>
              <input
                style={{
                  width:'100%',
                  padding:'14px 16px',
                  borderRadius:12,
                  border:'2px solid #e2e8f0',
                  fontSize:'1rem',
                  transition:'all 0.25s ease',
                  outline:'none',
                  boxSizing:'border-box',
                  opacity: biometricVerified || questionOk ? 0.5 : 1
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                type="password"
                value={oldPass}
                onChange={e=>setOldPass(e.target.value)}
                placeholder="Nhập mật khẩu cũ..."
                disabled={biometricVerified || questionOk}
              />
              <button
                style={{
                  width:'100%',
                  padding:'12px 20px',
                  marginTop:12,
                  borderRadius:12,
                  border:'2px solid #667eea',
                  background:'white',
                  color:'#667eea',
                  fontSize:'0.95rem',
                  fontWeight:600,
                  cursor:(biometricVerified || !isBiometricSupported) ? 'not-allowed' : 'pointer',
                  transition:'all 0.25s ease',
                  opacity:(biometricVerified || !isBiometricSupported) ? 0.5 : 1
                }}
                onMouseEnter={(e) => {if(!biometricVerified && isBiometricSupported){e.target.style.background = '#667eea'; e.target.style.color = 'white'}}}
                onMouseLeave={(e) => {if(!biometricVerified && isBiometricSupported){e.target.style.background = 'white'; e.target.style.color = '#667eea'}}}
                type="button"
                onClick={handleBiometricVerify}
                disabled={biometricVerified || !isBiometricSupported}
              >
                {biometricVerified ? '✓ Đã xác thực sinh học' : '🔐 Xác nhận bằng sinh học'}
              </button>
              {savedQuestion && !questionOk && (
                <div style={{marginTop:16,padding:16,background:'#f7fafc',borderRadius:12}}>
                  <label style={{display:'block',fontWeight:600,fontSize:'0.9rem',color:'#4a5568',marginBottom:8}}>Hoặc trả lời câu hỏi bảo mật:</label>
                  <input
                    style={{
                      width:'100%',
                      padding:'12px 16px',
                      borderRadius:10,
                      border:'2px solid #e2e8f0',
                      fontSize:'0.95rem',
                      transition:'all 0.25s ease',
                      outline:'none',
                      boxSizing:'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    type="text"
                    value={userAnswer}
                    onChange={e=>setUserAnswer(e.target.value)}
                    placeholder={savedQuestion}
                  />
                  <button
                    style={{
                      width:'100%',
                      padding:'10px 16px',
                      marginTop:10,
                      borderRadius:10,
                      border:'none',
                      background:'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color:'white',
                      fontSize:'0.9rem',
                      fontWeight:600,
                      cursor:'pointer',
                      transition:'all 0.25s ease'
                    }}
                    onMouseEnter={(e) => {e.target.style.transform = 'translateY(-1px)'}}
                    onMouseLeave={(e) => {e.target.style.transform = 'translateY(0)'}}
                    type="button"
                    onClick={handleCheckQuestion}
                  >
                    Xác nhận đáp án
                  </button>
                </div>
              )}
              {questionOk && (
                <div style={{marginTop:12,padding:12,background:'#d1fae5',borderRadius:10,color:'#065f46',fontSize:'0.9rem',fontWeight:600,textAlign:'center'}}>
                  ✓ Đã xác thực câu hỏi bảo mật
                </div>
              )}
            </div>
            <div style={{marginBottom:0}}>
              <label style={{display:'block',fontWeight:600,fontSize:'0.95rem',color:'#4a5568',marginBottom:8}}>Mật khẩu mới</label>
              <input
                style={{
                  width:'100%',
                  padding:'14px 16px',
                  borderRadius:12,
                  border:'2px solid #e2e8f0',
                  fontSize:'1rem',
                  transition:'all 0.25s ease',
                  outline:'none',
                  boxSizing:'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                type="password"
                value={newPass}
                onChange={e=>setNewPass(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
              />
            </div>
            <div style={{marginBottom:0}}>
              <label style={{display:'block',fontWeight:600,fontSize:'0.95rem',color:'#4a5568',marginBottom:8}}>Xác nhận mật khẩu</label>
              <input
                style={{
                  width:'100%',
                  padding:'14px 16px',
                  borderRadius:12,
                  border:'2px solid #e2e8f0',
                  fontSize:'1rem',
                  transition:'all 0.25s ease',
                  outline:'none',
                  boxSizing:'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                type="password"
                value={confirmPass}
                onChange={e=>setConfirmPass(e.target.value)}
                placeholder="Nhập lại mật khẩu..."
              />
            </div>
            <button
              style={{
                width:'100%',
                padding:'14px 20px',
                borderRadius:12,
                border:'none',
                background:'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color:'white',
                fontSize:'1rem',
                fontWeight:600,
                cursor:'pointer',
                transition:'all 0.25s ease',
                boxShadow:'0 4px 12px rgba(16, 185, 129, 0.3)',
                marginTop:8
              }}
              onMouseEnter={(e) => {e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'}}
              onMouseLeave={(e) => {e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'}}
              type="submit"
            >
              Đặt lại mật khẩu
            </button>
            <button
              style={{
                width:'100%',
                padding:'12px 20px',
                borderRadius:12,
                border:'none',
                background:'transparent',
                color:'#667eea',
                fontSize:'0.95rem',
                fontWeight:600,
                cursor:'pointer',
                transition:'all 0.25s ease'
              }}
              onMouseEnter={(e) => {e.target.style.background = 'rgba(102, 126, 234, 0.1)'}}
              onMouseLeave={(e) => {e.target.style.background = 'transparent'}}
              type="button"
              onClick={()=>{setShowReset(false);setBiometricVerified(false);setOldPass('');setUserAnswer('');setQuestionOk(false);}}
            >
              ← Quay lại đăng nhập
            </button>
          </form>
        )}
        {error && (
          <div style={{
            marginTop:20,
            padding:'16px 20px',
            borderRadius:12,
            background:error.includes('thành công') ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            color:error.includes('thành công') ? '#065f46' : '#991b1b',
            fontSize:'0.95rem',
            fontWeight:600,
            textAlign:'center',
            border:error.includes('thành công') ? '2px solid #6ee7b7' : '2px solid #fca5a5'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
