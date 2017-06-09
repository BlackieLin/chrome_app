var weixinData=null;
var caijiDate=null;
function setWeixinData(data){
	weixinData=data;
}
function getWeixinData(){
	return weixinData;
}
function setCaijiDate(startDate,endDate){
	caijiDate={
		start_date : startDate,
		end_date   : endDate
	}
}
function getCaijiDate(){
	return caijiDate;
}