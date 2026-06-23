const HandleApiError = (error, name) =>{
    let result = false;
    if (error) {
        const tip = name ? `${name}错误：` : '';
        ShowToast(error.message ? `${tip}${error.message}` : `请求失败: ${error}`);
        result = true;
    }
    return result;
}
// 封装提示框
const ShowToast = (str, duration = 3000, icon = 'none') => {
    uni.showToast({ title: str, duration: duration, icon});
}

// 封装ShowLoading
const ShowLoading = (str) => {
    uni.showLoading({
        title: str,
        mask: true
    });
}

// 封装HideLoading
const HideLoading = () => {
    uni.hideLoading();
}

export {
    HandleApiError,
    ShowToast,
	ShowLoading,
	HideLoading
}