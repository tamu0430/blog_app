export const getHeaders = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
})

export const loadToken = () => {
  try {
    const token = localStorage.getItem('token');
    return token;
  } catch {
    console.error('tokenの取得に失敗しました。')
    return null;
  }
}

export const saveToken = (token: string) => {
  try {
    localStorage.setItem('token', token);
  } catch {
    console.error('tokenの保存に失敗しました。')
  }
}

export const deleteToken = () => {
  try {
    localStorage.removeItem('token');
  } catch {
    console.error('tokenの削除に失敗しました。')
  }
}
