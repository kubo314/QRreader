const video = document.createElement("video");
const canvasElement = document.getElementById("canvas");
const canvas = canvasElement.getContext("2d");
const loadingMessage = document.getElementById("loadingMessage");
const outputContainer = document.getElementById("output");
const outputMessage = document.getElementById("outputMessage");
const outputData = document.getElementById("outputData");

const input_elems = document.querySelectorAll("input");

let read_data = "";

function drawLine(begin, end, color) {
    canvas.beginPath();
    canvas.moveTo(begin.x, begin.y);
    canvas.lineTo(end.x, end.y);
    canvas.lineWidth = 4;
    canvas.strokeStyle = color;
    canvas.stroke();
}

// Use facingMode: environment to attemt to get the front camera on phones
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function (stream) {
    video.srcObject = stream;
    video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
    video.play();
    requestAnimationFrame(tick);
});

function tick() {
    loadingMessage.innerText = "⌛ カメラを読み込んでいます…"
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        loadingMessage.hidden = true;
        canvasElement.hidden = false;
        outputContainer.hidden = false;

        canvasElement.height = video.videoHeight;
        canvasElement.width = video.videoWidth;
        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
        var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
        var code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });
        if (code) {
            drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
            drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
            drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
            drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
            outputMessage.hidden = true;
            outputData.parentElement.hidden = false;
            outputData.innerText = code.data;
            
            if (read_data === code.data) {
                read_data = code.data;
                console.log("aa")
            } else {
                const decoded_arry = decode_qr_data(code.data);
                if (decoded_arry) {
                    read_data = code.data;
                    input_elems[0].value = decoded_arry[2]
                    for (let i = 0; i < 5; i++) {
                        input_elems[i + 1].value = decoded_arry[0][i]
                    }
                    document.querySelector("form").submit();
                    document.querySelector("form").reset();
                    alert("✅QRコードを読み取りました。");
                } else {
                    alert("⛔QRコードが不正です。⛔")
                }
            }

        } else {
            outputMessage.hidden = false;
            outputData.parentElement.hidden = true;
        }
    }
    requestAnimationFrame(tick);
}


function decode_qr_data(data) {
    let decoded_data = "";
    let array;
    try {
        decoded_data = atob(data);
    } catch (e) {
        return false;
    }
    try {
        array = JSON.parse(decoded_data);
    } catch (e) {
        return false;
    }
    if (matches_structure(array)) {
        return array;
    } else {
        return false;
    }
}
function isValidJson(value) {
    try {
        JSON.parse(value)
    } catch (e) {
        return false
    }
    return true
}


function matches_structure(arr) {
    // 配列の長さが3であることを確認
    if (!Array.isArray(arr) || arr.length !== 3) return false;

    const [intArray, singleInt, singleStr] = arr;

    // 1. 最初の要素が配列で、長さ5、すべて整数
    if (
        !Array.isArray(intArray) ||
        intArray.length !== 5 ||
        !intArray.every(Number.isInteger)
    ) {
        return false;
    }

    // 2. 2番目の要素が整数
    if (!Number.isInteger(singleInt)) return false;

    // 3. 3番目の要素が文字列
    if (typeof singleStr !== 'string') return false;

    return true;
}
