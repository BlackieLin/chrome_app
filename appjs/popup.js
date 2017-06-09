/**
* 在前台页面弹出错误消息
* 
* @return void
*/
function showErrorMsg(windowId,msg){
  chrome.tabs.sendRequest(windowId, {action:"error",msg:msg});
}
/**
* 加载展示层
*/
function loadPopupUl(weixinData){
	var weixinWrap=document.getElementById("weixin");
	var liList=weixinWrap.getElementsByTagName("li");
	weixinWrap.getElementsByClassName("logo").item(0).src=weixinData.logo_url;
	liList.item(1).getElementsByTagName("span").item(0).innerHTML=weixinData.nickname;
	liList.item(2).getElementsByTagName("span").item(0).innerHTML=weixinData.weixin_type;
	liList.item(3).getElementsByTagName("span").item(0).innerHTML=weixinData.verify_type;
	liList.item(4).getElementsByTagName("span").item(0).innerHTML=weixinData.added_message;
	liList.item(5).getElementsByTagName("span").item(0).innerHTML=weixinData.added_fans;
	liList.item(6).getElementsByTagName("span").item(0).innerHTML=weixinData.total_fans;
	liList.item(7).getElementsByTagName("span").item(0).innerHTML=weixinData.weixin_date;
	liList.item(8).getElementsByTagName("span").item(0).innerHTML=weixinData.caiji_time;
	weixinWrap.style.display="block";
	document.getElementById("save_btn").style.display="block";
}
function showErrorMsg(msg){
	var errorWrap=document.getElementById("error");
	errorWrap.innerHTML=msg;
	errorWrap.style.display="block";
	setTimeout(function(){
		errorWrap.style.display="none";
	},2300);
}
function showSuccessMsg(msg){
	var errorWrap=document.getElementById("success");
	errorWrap.innerHTML=msg;
	errorWrap.style.display="block";
	setTimeout(function(){
		errorWrap.style.display="none";
	},2300);
}
/*
* int值转换为指定长度字符串
*/
function formatN(n,slength){
	var objN=new Number(n);
	var result=objN.toString();
	var padStr="",padTimes=slength-result.length,i;
	for(i=0;i<padTimes;i++){
		padStr+="0";
	}
	return padStr+result;
}
/*向后台接口发送数据*/
function requestHoutai(data){
	var url="http://www.test.com/api/weixindata.php";
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4) {
				if (xmlhttp.status == 200) {
					var retVal = xmlhttp.responseText;
					var procSuccess=true;
					try  {
						retVal=JSON.parse(retVal);
					}catch(exception) {
						console.log(exception);
						procSuccess=false;
					}
					if(procSuccess){
						if(retVal.success){
							showSuccessMsg("保存数据成功");
						}else{
							showErrorMsg(retVal.msg);
						}
					}else{
						showErrorMsg("千家铺后台接口json格式错误");
					}
				} else {
					showErrorMsg("请求千家铺后台接口失败,"+xmlhttp.status+" "+xmlhttp.statusText);
				}
			}
		};
	xmlhttp.open("POST", url, true);
	xmlhttp.send(JSON.stringify(data));
}
var isDebug=false;
var bgWin=chrome.extension.getBackgroundPage();
var weixinData=bgWin.getWeixinData();
if(weixinData!=null){
	loadPopupUl(weixinData);
}
/*计算昨天的日期*/
var caiji_date_el=document.getElementById("caiji_date");
var myDate = new Date();
var timeT=myDate.getTime()-(24*3600*1000);
myDate.setTime(timeT);
caiji_date_el.value=myDate.getFullYear()+"-"+formatN(myDate.getMonth()+1,2)+"-"+formatN(myDate.getDate(),2);

/*弹出菜单的按钮点击事件*/
document.getElementById("btn").addEventListener("click",function(){
	 chrome.tabs.getSelected(null, function(tab){
		 var sendData={"action":"caiji","date":caiji_date_el.value,isDebug:isDebug};
		 /*验证填写的日期格式*/
		 var regu =/^\d{4}-\d{2}-\d{2}$/;
		 var re = new RegExp(regu);
		 if(!re.test(sendData.date)){
			 showErrorMsg("日期格式错误");
			 return;
		 }
		 chrome.tabs.sendRequest(tab.id, sendData, function(response) {
			/*后台保存采集的数据*/
			if(response.success){
				bgWin.setWeixinData(response.data);
				loadPopupUl(response.data);
				showSuccessMsg("采集数据成功");
			}else{
				showErrorMsg(response.msg);
			}
		  });
    });
});
document.getElementById("save_btn").addEventListener("click",function(){
	 chrome.tabs.getSelected(null, function(tab){
		 /*console.log(tab);*/
		 weixinData=bgWin.getWeixinData();
		 if(weixinData==null){
			 showErrorMsg("请先采集数据");
			 return;
		 }
		 /*向后台接口发送数据*/
		 requestHoutai(weixinData);
		 /*chrome.tabs.sendRequest(tab.id, {"action":"save",data:weixinData});*/
    });
});