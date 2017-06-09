/**
 * ajax请求
 */
function ajaxGet(url,successFn,errorFn){
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
						successFn(retVal);
					}else{
						errorFn("json parse error");
					}
				} else {
					errorFn(xmlhttp.status+" "+xmlhttp.statusText);
				}
			}
		};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	if(request.action=="error"){
		alert(request.msg);
		return;
	}else if(request.action=="gohome"){
		sendResponse({success:true});
		location.href="/";
		return;
	}else if(request.action=="caiji"){
		var wxDate=request.date;
		var isDebug=request.isDebug;
		var myDate = new Date();
		var weixinData={
			nickname      : "",
			gzh_username  : "",
			logo_url      : "",
			weixin_type   : "",
			verify_type   : "",
			caiji_time    : myDate.getTime(),
			weixin_date   : wxDate,
			user_data     : null,
			article_data  : null,
			all_article_data :null
			
		};
		/*最后两个可能为空数组*/
		var accountList=document.getElementsByClassName("account");
		if(accountList.length!=1){
			showErrorMsg("获取微信数据失败");
			return;
		}
		/*微信名称*/
		weixinData.nickname=accountList.item(0).getElementsByClassName("nickname").item(0).innerHTML;
		/*logo地址/微信类型/认证类型*/
		weixinData.logo_url=accountList.item(0).getElementsByClassName("avatar").item(0).src;
		var type_wrp=accountList.item(0).getElementsByClassName("type_wrp").item(0);
		var tmpAlist=type_wrp.getElementsByTagName("a");
		weixinData.weixin_type=tmpAlist.item(0).innerHTML;
		weixinData.verify_type=tmpAlist.item(1).innerHTML;
		/*获取token*/
		var patt = new RegExp(/token=(\d+)$/);
		var match=patt.exec(location.search);
		if(match==null){
			/*发送数据给弹出菜单*/
			sendResponse({
				success : false,
				msg     : "获取token失败"  
			});
			return;
		}
		var token=match[1];
		/*用户分析*/
		ajaxGet(
			"/misc/useranalysis?&begin_date="+wxDate+"&end_date="+wxDate+"&source=99999999,99999999&token="+token+"&lang=zh_CN&f=json&ajax=1&random="+Math.random(),
			function(common_data){
				if(isDebug){
					console.log("用户分析");
					console.log(common_data);
				}
				weixinData.user_data=common_data.category_list[0].list[0];
				weixinData.gzh_username=common_data.user_info.user_name;
				/*单篇图文*/
				ajaxGet(
					"/misc/appmsganalysis?action=all&begin_date="+wxDate+"&end_date="+wxDate+"&order_by=1&order_direction=2&token="+token+"&lang=zh_CN&f=json&ajax=1&random="+Math.random(),
					function(common_data1){
						if(isDebug){
							console.log("单篇图文");
							console.log(common_data1);
						}
						eval("weixinData.article_data="+common_data1.total_article_data+";");
						/*全部图文*/
						ajaxGet(
							"/misc/appmsganalysis?action=report&type=daily&begin_date="+wxDate+"&end_date="+wxDate+"&token="+token+"&lang=zh_CN&f=json&ajax=1&random="+Math.random(),
							function(common_data2){
								if(isDebug){
									console.log("全部图文");
									console.log(common_data2);
								}
								weixinData.all_article_data=common_data2.item;
								/**/
								if(isDebug){
									console.log("最终数据");
									console.log(weixinData );
								}
								sendResponse({
									success : true,
									data     : weixinData 
								});
								/**/
							},
							function(error){
								sendResponse({
									success : false,
									msg     : "获取全部图文数据失败,"+error  
								});
							}
						);
						
					},
					function(error){
						sendResponse({
							success : false,
							msg     : "获取单篇图文数据失败,"+error  
						});
					}
				);
			},
			function(error){
				sendResponse({
					success : false,
					msg     : "获取用户分析数据失败,"+error  
				});
			}
		);
	}
});