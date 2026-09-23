(function () {
"use strict";
let groups=[];
const $=id=>document.getElementById(id);
async function load(){
 const role=await ServeUpProgress.getMyRole(); if(role!=="admin")return;
 $("groupAdmin").hidden=false;
 const [list,learners]=await Promise.all([ServeUpProgress.getTrainingGroups(),ServeUpProgress.getAdminLearners()]);
 groups=list; $("groupSelect").innerHTML=list.map(g=>"<option value='"+g.id+"'>"+g.name+" ("+g.member_count+")</option>").join("");
 $("groupLearnerSelect").replaceChildren(...learners.map(l=>{const option=document.createElement("option");option.value=l.user_id;option.textContent=l.display_name?l.display_name+" · "+l.email:l.email;return option;}));
 await members();
}
async function members(){const id=$("groupSelect").value;if(!id){$("groupMembers").textContent="Create a group first.";return;}const x=await ServeUpProgress.getTrainingGroupMembers(id);$("groupMembers").textContent=x.length?"Members: "+x.map(a=>a.email).join(", "):"No members yet.";}
$("groupForm").addEventListener("submit",async e=>{e.preventDefault();await ServeUpProgress.createTrainingGroup($("groupName").value,$("groupDescription").value);$("groupName").value="";$("groupDescription").value="";$("groupStatus").textContent="Group created.";await load();});
$("groupSelect").addEventListener("change",members);
$("memberForm").addEventListener("submit",async e=>{e.preventDefault();await ServeUpProgress.addTrainingGroupMember($("groupSelect").value,$("groupLearnerSelect").value);$("groupStatus").textContent="Learner added.";await members();await load();});
$("groupAssignmentForm").addEventListener("submit",async e=>{e.preventDefault();const count=await ServeUpProgress.assignTrainingGroupCourse($("groupSelect").value,$("groupCourseSelect").value,$("groupDueDate").value);$("groupStatus").textContent=count+" learner(s) assigned.";});
load().catch(e=>{console.error(e);$("groupStatus").textContent="Could not load group management.";});
}());
