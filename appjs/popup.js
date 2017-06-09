/**
* 在前台页面弹出错误消息
* 
* @return void
*/
function showErrorMsg(windowId,msg){
  chrome.tabs.sendRequest(windowId, {action:"error",msg:msg});
}
/*
* int值左侧填充0,返回指定长度字符串
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

/*格式化日期字符串*/
function formatDateStr(myDate){
	return myDate.getFullYear()+"-"+formatN(myDate.getMonth()+1,2)+"-"+formatN(myDate.getDate(),2);
}
/*
 * 获取两个日期之间的所有日期
 */
function getDateArr(start_date,end_date){
	/*格式验证*/
	var regu =/^\d{4}-\d{2}-\d{2}$/;
	var re = new RegExp(regu);
	if(!re.test(start_date)){
	 showErrorMsg("开始日期格式错误");
	 return [];
	}
	if(!re.test(end_date)){
	 showErrorMsg("结束日期格式错误");
	 return [];
	}
	/*转为时间戳*/
	var startT=Date.parse(start_date),endT=Date.parse(end_date);
	if(startT>endT){
		showSuccessMsg("日期顺序错误");
		return [];
	}
	var dateArr=[],ti=0,tmpT;
	var tmpDate=new Date();
	while(true){
		tmpT=startT+(ti*24*3600*1000);
		ti++;
		if(tmpT<=endT){
			tmpDate.setTime(tmpT);
			dateArr.push(formatDateStr(tmpDate));
		}else{
			break;
		}
	}
	return dateArr;
}
/**
* 加载展示层
*/
function loadPopupUl(weixinData){
	var weixinWrap=document.getElementById("weixin");
	var liList=weixinWrap.getElementsByTagName("li");
	weixinWrap.getElementsByClassName("logo").item(0).src=weixinData.logo_url;
	liList.item(1).getElementsByTagName("span").item(0).innerHTML=weixinData.nickname;
	liList.item(2).getElementsByTagName("span").item(0).innerHTML=weixinData.gzh_username;
	liList.item(3).getElementsByTagName("span").item(0).innerHTML=weixinData.weixin_type;
	liList.item(4).getElementsByTagName("span").item(0).innerHTML=weixinData.verify_type;
	liList.item(5).getElementsByTagName("span").item(0).innerHTML=weixinData.weixin_date;
	var myDate = new Date();
	myDate.setTime(weixinData.caiji_time);
	liList.item(6).getElementsByTagName("span").item(0).innerHTML=myDate.getFullYear()+"-"+formatN(myDate.getMonth()+1,2)+"-"+formatN(myDate.getDate(),2)+" "+
		formatN(myDate.getHours(),2)+":"+formatN(myDate.getMinutes(),2)+":"+formatN(myDate.getSeconds(),2);
	weixinWrap.style.display="block";
}
/**/
function showErrorMsg(msg){
	var errorWrap=document.getElementById("error");
	errorWrap.innerHTML=msg;
	errorWrap.style.display="block";
	setTimeout(function(){
		errorWrap.style.display="none";
	},2600);
}
function showSuccessMsg(msg){
	var errorWrap=document.getElementById("success");
	errorWrap.innerHTML=msg;
	errorWrap.style.display="block";
	setTimeout(function(){
		errorWrap.style.display="none";
	},2600);
}
/*向后台接口发送数据*/
function requestHoutai(data,successFn){
	var url="http://www.qianjiapu.com/bdbapi/weixin_report_data.php";
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4) {
				if (xmlhttp.status == 200) {
					var retVal = xmlhttp.responseText;
					var procSuccess=true;
					try  {
						retVal=JSON.parse(retVal);
					}catch(exception) {
						procSuccess=false;
					}
					if(procSuccess){
						if(retVal.code==200){
							showSuccessMsg(retVal.detail);
							successFn();
						}else{
							showErrorMsg(retVal.detail);
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
var start_date_el=document.getElementById("start_date");
var end_date_el=document.getElementById("end_date");
var cacheDate=bgWin.getCaijiDate();
if(cacheDate==null){
	/*计算默认的开始结束日期*/
	var myDate = new Date();

	var timeT=myDate.getTime()-(24*3600*1000);
	myDate.setTime(timeT);
	end_date_el.value=formatDateStr(myDate);

	timeT=myDate.getTime()-(6*24*3600*1000);
	myDate.setTime(timeT);
	start_date_el.value=formatDateStr(myDate);
}else{
	start_date_el.value=cacheDate.start_date;
	end_date_el.value=cacheDate.end_date;
}

/*弹出菜单的按钮点击事件*/
document.getElementById("btn").addEventListener("click",function(){
	var startDate=start_date_el.value,endDate=end_date_el.value;
	var dateArr=getDateArr(startDate,endDate);
	bgWin.setCaijiDate(startDate,endDate);
	 chrome.tabs.getSelected(null, function(tab){
		 var sendRequest=function(dateIndex){
			if(dateIndex>=dateArr.length){
				/*全部保存完毕*/
				return;
			}
			var sendData={"action":"caiji","date":dateArr[dateIndex],isDebug:isDebug};
			chrome.tabs.sendRequest(tab.id, sendData, function(response) {
			 if(response==undefined){
				 /*token过期,或者不是微信后台首页*/
				 chrome.tabs.sendRequest(tab.id, {"action":"gohome"}, function(response1) {
					 if(response1==undefined){
						showErrorMsg("请在微信后台首页运行此插件");
					 }else{
						showErrorMsg("token过期,请在页面重载后再采集");
					 }
				 });
				 return;
			 }
			/*后台保存采集的数据*/
			if(response.success){
				bgWin.setWeixinData(response.data);
				loadPopupUl(response.data);
				dateIndex++;
				var tipstr="采集"+sendData.date+"数据成功";
				tipstr+=",正在保存……";
				if(dateIndex<dateArr.length){
					tipstr+=("<br/>,准备采集"+dateArr[dateIndex]+"数据");
				}
				showSuccessMsg(tipstr);
				requestHoutai(response.data,function(){
					/**/
					setTimeout(function(){
						sendRequest(dateIndex);
					},100);
					/**/
				});
			}else{
				showErrorMsg(response.msg);
			}
		  });				
				
		 };
		 sendRequest(0);
    });
});