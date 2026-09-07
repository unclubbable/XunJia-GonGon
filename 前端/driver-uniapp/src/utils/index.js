/**
 * 通用 UI / 提示工具（司机端）
 * 与乘客端 API 形状对齐，便于对照维护
 */
const HandleApiError = (error, name) => {
    let result = false;
    if (error) {
        const tip = name ? `${name}错误：` : '';
        ShowToast(error.message ? `${tip}${error.message}` : `请求失败: ${error}`);
        result = true;
    }
    return result;
};

// 封装提示框（默认无图标、3 秒）
const ShowToast = (str, duration = 3000, icon = 'none') => {
    uni.showToast({ title: str, duration, icon });
};

const ShowLoading = (str) => {
    uni.showLoading({
        title: str,
        mask: true
    });
};

const HideLoading = () => {
    uni.hideLoading();
};

export {
    HandleApiError,
    ShowToast,
	ShowLoading,
	HideLoading
}
