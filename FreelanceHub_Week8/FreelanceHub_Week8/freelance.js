
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const STORE_PROFILE = "freelancehubProfile";
  const STORE_SERVICES = "freelancehubServices";

  const defaultProfile = {
    fullName: "Ayesha Khan",
    professionalTitle: "UI/UX Designer",
    location: "Karachi, Pakistan",
    experience: "3 years",
    bio: "I am a creative UI/UX designer who creates clean, accessible and user-friendly digital experiences. I enjoy turning complex problems into simple interfaces.",
    skills: "Figma, UI Design, Wireframing, Prototyping"
  };
  const defaultServices = [{
    id: "sample-1",
    title: "I will design a modern mobile app UI in Figma",
    category: "UI/UX Design",
    price: 8000,
    delivery: "5 days",
    description: "I will design a clean, modern and user-friendly mobile app interface in Figma. The service includes key screens, reusable components and a clickable prototype.",
    tags: ["Figma", "UI Design", "Mobile App", "Prototyping"],
    image: "🎨"
  }];

  function read(key, fallback) {
    try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
    catch { return fallback; }
  }
  function profile() { return read(STORE_PROFILE, defaultProfile); }
  function services() { return read(STORE_SERVICES, defaultServices); }
  function saveServices(items) { localStorage.setItem(STORE_SERVICES, JSON.stringify(items)); }
  function initials(name) {
    return (name || "Freelancer").trim().split(/\s+/).slice(0,2).map(x => x[0]).join("").toUpperCase();
  }
  function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function toast(message) {
    const el = $("toast");
    if (!el) return;
    el.textContent = message; el.classList.add("show");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }
  const menuToggle = $("menuToggle"), navLinks = $("navLinks");
  if (menuToggle && navLinks) menuToggle.addEventListener("click", () => navLinks.classList.toggle("active"));

  // Retain Week 2 homepage search behaviour.
  const searchForm = $("searchForm");
  if (searchForm) searchForm.addEventListener("submit", e => {
    e.preventDefault(); const q = $("searchInput")?.value.trim();
    if (q) location.href = `freelancers.html?search=${encodeURIComponent(q)}`;
  });
  document.querySelectorAll(".popular-searches [data-search]").forEach(btn => btn.addEventListener("click", () => {
    location.href = `freelancers.html?search=${encodeURIComponent(btn.dataset.search)}`;
  }));

  // Profile page.
  const p = profile();
  if ($("profileName")) {
    $("profileName").textContent = p.fullName; $("profileTitle").textContent = p.professionalTitle;
    $("profileLocation").textContent = p.location || "Location not added";
    $("profileInitials").textContent = initials(p.fullName);
    $("profileBio").textContent = p.bio; $("profileExperience").textContent = p.experience || "Experience not added";
    $("profileSkills").innerHTML = (p.skills || "").split(",").map(s=>s.trim()).filter(Boolean).map(s=>`<span class="pill">${safe(s)}</span>`).join("");
    $("serviceCount").textContent = services().length;
    renderPreview();
  }
  if ($("publicName")) {
    $("publicName").textContent = p.fullName; $("publicNameSide").textContent = p.fullName;
    $("publicTitle").textContent = `${p.professionalTitle} · ${p.location}`;
    $("publicTitleSide").textContent = p.professionalTitle; $("publicInitials").textContent = initials(p.fullName);
    $("publicBio").textContent = p.bio;
    $("publicSkills").innerHTML = (p.skills || "").split(",").map(s=>s.trim()).filter(Boolean).map(s=>`<span class="pill">${safe(s)}</span>`).join("");
    renderCards($("publicServices"), services().slice(0,3), false);
  }

  // Edit profile: browser-side required-field validation + localStorage.
  const profileForm = $("profileForm");
  if (profileForm) {
    const current = profile();
    $("fullName").value = current.fullName; $("professionalTitle").value = current.professionalTitle;
    $("location").value = current.location; $("experience").value = current.experience;
    $("bio").value = current.bio; $("skills").value = current.skills;
    profileForm.addEventListener("submit", e => {
      e.preventDefault();
      if (!profileForm.reportValidity()) return;
      const updated = {
        fullName: $("fullName").value.trim(), professionalTitle: $("professionalTitle").value.trim(),
        location: $("location").value.trim(), experience: $("experience").value.trim(),
        bio: $("bio").value.trim(), skills: $("skills").value.trim()
      };
      if (updated.bio.length < 20) { $("profileFormMessage").innerHTML = '<div class="notice error">Please write at least 20 characters in your bio.</div>'; return; }
      localStorage.setItem(STORE_PROFILE, JSON.stringify(updated));
      toast("Profile updated successfully!");
      setTimeout(() => location.href = "profile.html", 500);
    });
  }

  // Service form supports both create and edit.
  const serviceForm = $("serviceForm");
  if (serviceForm) {
    const editId = new URLSearchParams(location.search).get("edit");
    if (editId) {
      const found = services().find(s => s.id === editId);
      if (found) {
        $("serviceId").value = found.id; $("serviceTitle").value = found.title;
        $("serviceCategory").value = found.category; $("servicePrice").value = found.price;
        $("deliveryTime").value = found.delivery; $("serviceDescription").value = found.description;
        $("serviceTags").value = found.tags.join(", "); $("serviceImage").value = found.image || "";
        $("serviceSubmit").textContent = "Save Service Changes";
        document.querySelector(".page-heading h1").textContent = "Edit Service";
      }
    }
    serviceForm.addEventListener("submit", e => {
      e.preventDefault();
      if (!serviceForm.reportValidity()) return;
      const title = $("serviceTitle").value.trim(), description = $("serviceDescription").value.trim();
      const price = Number($("servicePrice").value), tags = $("serviceTags").value.split(",").map(x=>x.trim()).filter(Boolean);
      if (title.length < 10 || description.length < 30 || !Number.isFinite(price) || price < 500 || tags.length === 0) {
        $("serviceFormMessage").innerHTML = '<div class="notice error">Check your title, description, price (minimum PKR 500) and add at least one skill tag.</div>'; return;
      }
      const all = services(), id = $("serviceId").value || `service-${Date.now()}`;
      const item = { id, title, category: $("serviceCategory").value, price,
        delivery: $("deliveryTime").value, description, tags, image: $("serviceImage").value.trim() || "💼" };
      const index = all.findIndex(s => s.id === id);
      if (index >= 0) all[index] = item; else all.unshift(item);
      saveServices(all); toast(index >= 0 ? "Service updated!" : "Service published!");
      setTimeout(() => location.href = "my-services.html", 500);
    });
  }

  function renderCards(container, items, actions) {
    if (!container) return;
    if (!items.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">🧩</div><h3>No services yet</h3><p class="muted">Create your first service to show clients what you offer.</p><a class="btn btn-primary" href="create-service.html">Create a Service</a></div>'; return;
    }
    container.innerHTML = items.map(s => `<article class="service-card">
      <div class="service-art">${safe(s.image || "💼")}</div><div class="service-card-body">
      <span class="eyebrow">${safe(s.category)}</span><h3>${safe(s.title)}</h3>
      <p class="muted">${safe((s.description || "").slice(0,105))}${s.description?.length>105?"…":""}</p>
      <div class="service-meta"><span>${safe(s.delivery)} delivery</span><strong class="service-price">PKR ${Number(s.price).toLocaleString("en-PK")}</strong></div>
      <div class="action-row"><a class="btn btn-outline btn-small" href="service-details.html?id=${encodeURIComponent(s.id)}">View</a>
      ${actions ? `<a class="btn btn-outline btn-small" href="create-service.html?edit=${encodeURIComponent(s.id)}">Edit</a><button class="btn btn-danger btn-small" data-delete="${safe(s.id)}" type="button">Delete</button>` : ""}</div>
      </div></article>`).join("");
  }
  function renderPreview() { renderCards($("profileServicePreview"), services().slice(0,1), false); }
  const list = $("myServicesList");
  if (list) {
    renderCards(list, services(), true);
    list.addEventListener("click", e => {
      const btn = e.target.closest("[data-delete]");
      if (!btn) return;
      const id = btn.dataset.delete;
      if (confirm("Delete this service? This action cannot be undone.")) {
        saveServices(services().filter(s => s.id !== id));
        renderCards(list, services(), true); toast("Service deleted.");
      }
    });
  }

  // Service details page.
  const details = $("serviceDetails");
  if (details) {
    const id = new URLSearchParams(location.search).get("id");
    const item = services().find(s => s.id === id) || services()[0];
    if (!item) details.innerHTML = '<div class="empty-state"><h2>Service not found</h2><a class="inline-link" href="my-services.html">Return to My Services</a></div>';
    else details.innerHTML = `<div class="detail-layout"><section class="panel"><div class="detail-visual">${safe(item.image || "💼")}</div><p class="eyebrow">${safe(item.category)}</p><h1 style="font-family:Manrope,sans-serif;margin-bottom:14px">${safe(item.title)}</h1><p>${safe(item.description)}</p><div class="tag-list">${item.tags.map(t=>`<span class="tag">${safe(t)}</span>`).join("")}</div></section><aside class="panel"><p class="muted">Starting price</p><p class="service-price" style="font-size:30px">PKR ${Number(item.price).toLocaleString("en-PK")}</p><p style="margin:14px 0">⏱ ${safe(item.delivery)} delivery</p><p class="muted">Offered by ${safe(profile().fullName)}</p><div class="form-actions"><a class="btn btn-primary" href="freelancer-profile.html">View Freelancer</a><a class="btn btn-outline" href="my-services.html">Back to Services</a></div></aside></div>`;
  }


  // =========================================
  // WEEK 4: JOB LISTINGS & PROPOSALS
  // =========================================
  const JOBS_KEY = "freelancehubJobs";
  const PROPOSALS_KEY = "freelancehubProposals";
  const sampleJobs = [
    {id:"job-sample-1",title:"Build a responsive business website",category:"Web Development",budget:45000,skills:["HTML","CSS","JavaScript","Responsive Design"],description:"We need a modern, responsive website for a small business. The website should include a home page, about page, services page and contact form. Please share examples of similar work and explain your development approach.",duration:"2–4 weeks",client:"BrightPath Studio",postedAt:new Date(Date.now()-86400000).toISOString(),proposals:3},
    {id:"job-sample-2",title:"Design a mobile app UI in Figma",category:"UI/UX Design",budget:30000,skills:["Figma","Wireframing","Prototyping","Mobile UI"],description:"Create a clean and easy-to-use mobile app interface. Deliverables include user flow, wireframes, high-fidelity screens and a clickable Figma prototype. Experience with mobile-first design is preferred.",duration:"1–2 weeks",client:"Horizon Apps",postedAt:new Date(Date.now()-2*86400000).toISOString(),proposals:5},
    {id:"job-sample-3",title:"Create social media brand graphics",category:"Graphic Design",budget:15000,skills:["Adobe Illustrator","Photoshop","Social Media"],description:"We are looking for a graphic designer to create a consistent set of social media post templates and promotional graphics for our growing brand.",duration:"Less than 1 week",client:"Urban Roots",postedAt:new Date(Date.now()-3*86400000).toISOString(),proposals:2},
    {id:"job-sample-4",title:"Write SEO-friendly website content",category:"Writing & Translation",budget:12000,skills:["SEO Writing","Research","Copywriting"],description:"Write engaging and well-researched website content for five main pages. The content should be original, easy to understand and optimized for relevant search terms.",duration:"1–2 weeks",client:"ContentCraft",postedAt:new Date(Date.now()-4*86400000).toISOString(),proposals:7}
  ];
  function readStore(key, fallback) {
    try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
    catch { return fallback; }
  }
  function getJobs() { return readStore(JOBS_KEY, sampleJobs); }
  function setJobs(items) { localStorage.setItem(JOBS_KEY, JSON.stringify(items)); }
  function getProposals() { return readStore(PROPOSALS_KEY, []); }
  function setProposals(items) { localStorage.setItem(PROPOSALS_KEY, JSON.stringify(items)); }
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  }
  function formatPKR(value) { return "PKR " + Number(value || 0).toLocaleString("en-PK"); }
  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleDateString("en-PK",{day:"numeric",month:"short",year:"numeric"});
  }
  function jobCard(job) {
    const tags = (job.skills || []).map(skill=>`<span class="job-skill">${escapeHTML(skill)}</span>`).join("");
    const description = (job.description || "").slice(0,170);
    return `<article class="job-card">
      <div class="job-card-top"><div><span class="job-category">${escapeHTML(job.category)}</span><h2><a href="job-details.html?id=${encodeURIComponent(job.id)}">${escapeHTML(job.title)}</a></h2><p class="muted">Posted by ${escapeHTML(job.client || "Client")}</p></div><div class="job-budget">${formatPKR(job.budget)}</div></div>
      <p class="job-description">${escapeHTML(description)}${job.description?.length>170?"…":""}</p>
      <div class="job-skills">${tags}</div>
      <div class="job-meta"><span>📅 ${formatDate(job.postedAt)}</span><span>⏱ ${escapeHTML(job.duration)}</span><span>✉ ${Number(job.proposals || 0)} proposals</span></div>
      <div class="job-card-actions"><a class="btn btn-primary" href="submit-proposal.html?job=${encodeURIComponent(job.id)}">Apply Now</a><a class="btn btn-outline" href="job-details.html?id=${encodeURIComponent(job.id)}">View Details</a></div>
    </article>`;
  }

  // Seed demo jobs only when no job data exists in this browser.
  if (localStorage.getItem(JOBS_KEY) === null) setJobs(sampleJobs);

  // Find Jobs: keyword search, category filter and sorting.
  const jobListings = $("jobListings");
  if (jobListings) {
    const search = $("jobSearch"), category = $("jobCategory"), sort = $("jobSort");
    const params = new URLSearchParams(location.search);
    if (params.get("search") && search) search.value = params.get("search");
    if (params.get("category") && category) category.value = params.get("category");
    function renderJobs() {
      const term = (search?.value || "").trim().toLowerCase();
      const cat = category?.value || "";
      let matches = getJobs().filter(job => {
        const searchable = [job.title,job.category,job.description,job.client,...(job.skills||[])].join(" ").toLowerCase();
        return (!term || searchable.includes(term)) && (!cat || job.category === cat);
      });
      if (sort?.value === "budget-high") matches.sort((a,b)=>b.budget-a.budget);
      else if (sort?.value === "budget-low") matches.sort((a,b)=>a.budget-b.budget);
      else matches.sort((a,b)=>new Date(b.postedAt)-new Date(a.postedAt));
      $("jobResultsCount").textContent = `Showing ${matches.length} ${matches.length===1?"job":"jobs"}`;
      jobListings.innerHTML = matches.length ? matches.map(jobCard).join("") :
        '<div class="empty-state"><div class="empty-icon">🔎</div><h3>No jobs found</h3><p class="muted">Try another keyword or category filter.</p><button class="btn btn-outline" id="clearJobFilters" type="button">Clear filters</button></div>';
    }
    [search,category,sort].forEach(control => control?.addEventListener("input",renderJobs));
    jobListings.addEventListener("click", e => {
      if (e.target.id === "clearJobFilters") { search.value=""; category.value=""; sort.value="newest"; renderJobs(); }
    });
    renderJobs();
  }

  // Job details page.
  const jobDetails = $("jobDetails");
  if (jobDetails) {
    const id = new URLSearchParams(location.search).get("id");
    const job = getJobs().find(item=>item.id===id);
    if (!job) jobDetails.innerHTML = '<div class="empty-state"><div class="empty-icon">📄</div><h2>Job not found</h2><a class="inline-link" href="jobs.html">Back to jobs</a></div>';
    else jobDetails.innerHTML = `<div class="job-detail-grid"><section class="panel job-detail-main"><span class="job-category">${escapeHTML(job.category)}</span><h1>${escapeHTML(job.title)}</h1><p class="muted">Posted by ${escapeHTML(job.client || "Client")} · ${formatDate(job.postedAt)}</p><h2 class="section-title" style="margin-top:25px">Project description</h2><p>${escapeHTML(job.description)}</p><h2 class="section-title" style="margin-top:25px">Required skills</h2><div class="job-skills">${(job.skills||[]).map(s=>`<span class="job-skill">${escapeHTML(s)}</span>`).join("")}</div></section><aside class="panel job-side-card"><p class="muted">Project budget</p><div class="budget-large">${formatPKR(job.budget)}</div><div class="detail-line"><span>Category</span><strong>${escapeHTML(job.category)}</strong></div><div class="detail-line"><span>Duration</span><strong>${escapeHTML(job.duration)}</strong></div><div class="detail-line"><span>Proposals</span><strong>${Number(job.proposals||0)}</strong></div><div class="detail-line"><span>Posted</span><strong>${formatDate(job.postedAt)}</strong></div><a class="btn btn-primary" style="width:100%;margin-top:20px" href="submit-proposal.html?job=${encodeURIComponent(job.id)}">Submit a Proposal</a></aside></div>`;
  }

  // Post a Job form.
  const jobForm = $("jobForm");
  if (jobForm) jobForm.addEventListener("submit", e => {
    e.preventDefault();
    if (!jobForm.reportValidity()) return;
    const title=$("jobTitle").value.trim(), description=$("jobDescription").value.trim();
    const budget=Number($("jobBudget").value), skills=$("jobSkills").value.split(",").map(s=>s.trim()).filter(Boolean);
    if (title.length<10 || description.length<30 || !Number.isFinite(budget) || budget<500 || !skills.length) {
      $("jobFormMessage").innerHTML='<div class="notice error">Please check the title, description, budget (minimum PKR 500) and required skills.</div>'; return;
    }
    const job = {id:`job-${Date.now()}`,title,category:$("jobCategoryInput").value,budget,skills,description,duration:$("jobDuration").value,client:$("clientName").value.trim()||"Independent Client",postedAt:new Date().toISOString(),proposals:0};
    const all=getJobs(); all.unshift(job); setJobs(all);
    toast("Your job has been published!");
    setTimeout(()=>location.href=`job-details.html?id=${encodeURIComponent(job.id)}`,450);
  });

  // Proposal form and submission.
  const proposalForm = $("proposalForm");
  if (proposalForm) {
    const jobId = new URLSearchParams(location.search).get("job");
    const job = getJobs().find(item=>item.id===jobId);
    if (job) {
      $("proposalJobId").value=job.id;
      $("proposalJobSummary").style.display="block";
      $("proposalJobSummary").innerHTML=`<strong>Applying for:</strong> ${escapeHTML(job.title)} · Budget ${formatPKR(job.budget)}`;
    } else {
      $("proposalJobSummary").style.display="block";
      $("proposalJobSummary").innerHTML='No specific job selected. <a class="inline-link" href="jobs.html">Choose a job first</a>.';
    }
    proposalForm.addEventListener("submit", e => {
      e.preventDefault();
      if (!proposalForm.reportValidity()) return;
      if (!job) { $("proposalFormMessage").innerHTML='<div class="notice error">Please select a valid job from Find Jobs before applying.</div>'; return; }
      const cover=$("coverLetter").value.trim(), price=Number($("proposalPrice").value), skills=$("proposalSkills").value.trim();
      if (cover.length<40 || price<500 || !skills) {
        $("proposalFormMessage").innerHTML='<div class="notice error">Write a cover letter of at least 40 characters and enter a valid price and relevant skills.</div>'; return;
      }
      const proposals=getProposals();
      if (proposals.some(p=>p.jobId===job.id)) {
        $("proposalFormMessage").innerHTML='<div class="notice error">You have already submitted a proposal for this job in this browser.</div>'; return;
      }
      proposals.unshift({id:`proposal-${Date.now()}`,jobId:job.id,jobTitle:job.title,client:job.client,coverLetter:cover,price,delivery:$("proposalDelivery").value,skills,status:"Pending",submittedAt:new Date().toISOString()});
      setProposals(proposals);
      const allJobs=getJobs(), jobIndex=allJobs.findIndex(j=>j.id===job.id);
      if(jobIndex>=0) allJobs[jobIndex].proposals=Number(allJobs[jobIndex].proposals||0)+1;
      setJobs(allJobs);
      toast("Proposal submitted successfully!");
      setTimeout(()=>location.href="my-proposals.html",450);
    });
  }

  // My Proposals: filter by status and show proposal information.
  const proposalsList = $("myProposalsList");
  if (proposalsList) {
    let activeStatus="All";
    function renderProposals() {
      const all=getProposals();
      const filtered=activeStatus==="All" ? all : all.filter(p=>p.status===activeStatus);
      proposalsList.innerHTML = filtered.length ? filtered.map(p=>`<article class="proposal-card">
        <div class="proposal-card-head"><div><span class="eyebrow">Proposal for</span><h3>${escapeHTML(p.jobTitle)}</h3><p class="muted">Client: ${escapeHTML(p.client || "Client")}</p></div><span class="status status-${String(p.status).toLowerCase()}">${escapeHTML(p.status)}</span></div>
        <p>${escapeHTML(p.coverLetter.slice(0,190))}${p.coverLetter.length>190?"…":""}</p>
        <div class="proposal-card-foot"><span><strong>${formatPKR(p.price)}</strong> · ${escapeHTML(p.delivery)}</span><span>Sent ${formatDate(p.submittedAt)}</span></div>
        <div class="job-card-actions" style="margin-top:14px"><a class="btn btn-outline btn-small" href="job-details.html?id=${encodeURIComponent(p.jobId)}">View Job</a></div>
      </article>`).join("") : '<div class="empty-state"><div class="empty-icon">📨</div><h3>No proposals here yet</h3><p class="muted">Browse open jobs and send your first proposal.</p><a class="btn btn-primary" href="jobs.html">Find Jobs</a></div>';
    }
    document.querySelectorAll(".proposal-tab").forEach(tab=>tab.addEventListener("click",()=>{
      document.querySelectorAll(".proposal-tab").forEach(t=>t.classList.remove("active"));
      tab.classList.add("active"); activeStatus=tab.dataset.status; renderProposals();
    }));
    renderProposals();
  }

});

/* ================= WEEK 6: MESSAGING, NOTIFICATIONS & REVIEWS ================= */
document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const toast = message => { const el=$("w6Toast"); if(!el)return; el.textContent=message; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2400); };
  const timeNow = () => new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
  const PROJECT_KEY="freelancehubProjects", MESSAGE_KEY="freelancehubMessages", NOTICE_KEY="freelancehubNotifications", REVIEW_KEY="freelancehubReviews";
  const conversationsSeed = [
    {id:"bright",name:"Bright Future Studio",initials:"BF",preview:"Can you share the latest homepage draft?",messages:[{from:"them",text:"Hi Ayesha! How is the marketplace homepage coming along?",time:"10:12 AM"},{from:"me",text:"It is going well. I have completed the main layout and responsive draft.",time:"10:18 AM"},{from:"them",text:"Can you share the latest homepage draft?",time:"10:24 AM"}]},
    {id:"urban",name:"Urban Roots",initials:"UR",preview:"Thank you for the social media kit!",messages:[{from:"them",text:"Thank you for the social media kit! The designs look great.",time:"Yesterday"}]},
    {id:"horizon",name:"Horizon Apps",initials:"HA",preview:"Let's confirm the project requirements.",messages:[{from:"them",text:"Hello! Let's confirm the project requirements before we begin.",time:"Mon"}]}
  ];
  let conversations=read(MESSAGE_KEY,conversationsSeed), activeId=conversations[0]?.id;
  if(!localStorage.getItem(MESSAGE_KEY)) write(MESSAGE_KEY,conversations);
  function renderConversations(){
    const host=$("conversationList"); if(!host)return;
    host.innerHTML=conversations.map(c=>`<button type="button" class="w6-conversation ${c.id===activeId?"active":""}" data-conversation="${esc(c.id)}"><span class="w6-avatar">${esc(c.initials)}</span><span class="w6-conv-main"><strong>${esc(c.name)}</strong><small>${esc(c.messages.at(-1)?.text||"No messages yet")}</small></span><span class="w6-conv-side">${esc(c.messages.at(-1)?.time||"")}<br>${c.unread?'<span class="w6-unread">New</span>':""}</span></button>`).join("");
    $("conversationCount").textContent=`${conversations.length} chats`;
    host.querySelectorAll("[data-conversation]").forEach(btn=>btn.addEventListener("click",()=>{activeId=btn.dataset.conversation;const c=conversations.find(x=>x.id===activeId);if(c)c.unread=false;write(MESSAGE_KEY,conversations);renderConversations();renderChat();}));
  }
  function renderChat(){
    const c=conversations.find(x=>x.id===activeId);if(!c||!$("chatMessages"))return;
    $("chatName").textContent=c.name;$("chatAvatar").textContent=c.initials;
    $("chatMessages").innerHTML=c.messages.map(m=>`<div class="w6-bubble ${m.from==="me"?"mine":"theirs"}">${esc(m.text)}<small>${esc(m.time)}</small></div>`).join("");
    $("chatMessages").scrollTop=$("chatMessages").scrollHeight;
  }
  if($("messageForm")){
    renderConversations();renderChat();
    $("messageForm").addEventListener("submit",e=>{e.preventDefault();const input=$("messageInput"),value=input.value.trim();if(!value)return;const c=conversations.find(x=>x.id===activeId);if(!c)return;c.messages.push({from:"me",text:value,time:timeNow()});c.unread=false;c.preview=value;write(MESSAGE_KEY,conversations);input.value="";renderConversations();renderChat();toast("Message sent.");});
  }

  let notifications=read(NOTICE_KEY,[
    {id:"n1",icon:"✉️",title:"New message received",description:"Bright Future Studio sent you a message about the homepage draft.",time:"Today · 10:24 AM",unread:true,link:"messages.html"},
    {id:"n2",icon:"✓",title:"Proposal accepted",description:"Your proposal for the Product Dashboard Prototype was accepted.",time:"Yesterday",unread:true,link:"orders.html"},
    {id:"n3",icon:"🚀",title:"Project started",description:"Your Portfolio Landing Page project is ready to begin.",time:"Nov 9, 2026",unread:false,link:"orders.html"},
    {id:"n4",icon:"🎉",title:"Project completed",description:"Product Dashboard Prototype has been marked as completed.",time:"Oct 28, 2026",unread:false,link:"orders.html"},
    {id:"n5",icon:"⭐",title:"New review received",description:"A client left feedback on your completed work.",time:"Oct 27, 2026",unread:true,link:"reviews.html"}
  ]);
  if(!localStorage.getItem(NOTICE_KEY))write(NOTICE_KEY,notifications);
  function renderNotifications(){
    const host=$("notificationList");if(!host)return;
    host.innerHTML=notifications.map(n=>`<article class="w6-notice ${n.unread?"unread":""}"><div class="w6-notice-icon">${esc(n.icon)}</div><div class="w6-notice-content"><strong>${esc(n.title)} ${n.unread?'<span class="w6-unread">Unread</span>':""}</strong><p>${esc(n.description)}</p><small>${esc(n.time)}</small></div><a class="btn btn-outline" href="${esc(n.link)}" data-notice="${esc(n.id)}">Open</a></article>`).join("")||'<div class="w6-empty">You are all caught up.</div>';
    host.querySelectorAll("[data-notice]").forEach(a=>a.addEventListener("click",()=>{const n=notifications.find(x=>x.id===a.dataset.notice);if(n){n.unread=false;write(NOTICE_KEY,notifications);}}));
  }
  if($("notificationList")){renderNotifications();$("markAllRead").addEventListener("click",()=>{notifications=notifications.map(n=>({...n,unread:false}));write(NOTICE_KEY,notifications);renderNotifications();toast("All notifications marked as read.");});}

  let reviews=read(REVIEW_KEY,[
    {id:"r1",project:"Product Dashboard Prototype",name:"Horizon Apps",rating:5,comment:"Excellent communication and a polished final prototype. The milestones were delivered on time.",date:"Oct 28, 2026"},
    {id:"r2",project:"Brand Social Media Kit",name:"Urban Roots",rating:4,comment:"Creative designs and a smooth handoff. Would happily work together again.",date:"Oct 20, 2026"}
  ]);
  if(!localStorage.getItem(REVIEW_KEY))write(REVIEW_KEY,reviews);
  let selectedRating=0;
  const projects=read(PROJECT_KEY,[]);
  function fillProjectOptions(){
    const select=$("reviewProject");if(!select)return;
    const completed=projects.filter(p=>p.status==="Completed");
    completed.forEach(project=>{const option=document.createElement("option");option.value=project.id;option.textContent=project.title;select.appendChild(option);});
    const requested=new URLSearchParams(location.search).get("project");if(requested&&completed.some(x=>x.id===requested))select.value=requested;
    if(!completed.length)select.innerHTML='<option value="">No completed projects yet</option>';
  }
  function renderReviews(){
    const host=$("reviewList");if(!host)return;
    host.innerHTML=reviews.length?reviews.slice().reverse().map(r=>`<article class="w6-review-card"><div class="w6-review-top"><span class="w6-avatar">${esc(r.name.split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase())}</span><div><strong>${esc(r.name)}</strong><small>${esc(r.project)} · ${esc(r.date)}</small></div></div><div class="w6-review-rating" aria-label="${r.rating} out of 5 stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div><p>${esc(r.comment)}</p></article>`).join(""):'<div class="w6-empty">No reviews yet. Be the first to share feedback.</div>';
  }
  function paintStars(){document.querySelectorAll(".w6-star").forEach(btn=>{const on=Number(btn.dataset.rating)<=selectedRating;btn.classList.toggle("selected",on);btn.setAttribute("aria-pressed",String(on));});if($("ratingHint"))$("ratingHint").textContent=selectedRating?`${selectedRating} out of 5 stars selected.`:"Select a rating from 1 to 5 stars.";}
  if($("reviewForm")){
    fillProjectOptions();renderReviews();
    document.querySelectorAll(".w6-star").forEach(btn=>btn.addEventListener("click",()=>{selectedRating=Number(btn.dataset.rating);paintStars();}));
    $("reviewForm").addEventListener("submit",e=>{e.preventDefault();const projectId=$("reviewProject").value,project=projects.find(x=>x.id===projectId),name=$("reviewerName").value.trim(),comment=$("reviewComment").value.trim();
      if(!project){$("reviewFeedback").textContent="Please select a completed project.";return;}
      if(!selectedRating){$("reviewFeedback").textContent="Please choose a star rating.";return;}
      if(name.length<2||comment.length<10){$("reviewFeedback").textContent="Enter your name and a review of at least 10 characters.";return;}
      const duplicate=reviews.some(r=>r.projectId===projectId&&r.name.toLowerCase()===name.toLowerCase());
      if(duplicate){$("reviewFeedback").textContent="You have already submitted a review for this project.";return;}
      reviews.push({id:`review-${Date.now()}`,projectId,project:project.title,name,rating:selectedRating,comment,date:new Date().toLocaleDateString("en-PK",{day:"numeric",month:"short",year:"numeric"})});
      write(REVIEW_KEY,reviews);renderReviews();$("reviewForm").reset();selectedRating=0;paintStars();$("reviewerName").value="Ayesha Khan";$("reviewFeedback").textContent="Thank you! Your review has been submitted.";toast("Review submitted successfully.");
    });
  }
});



/* ================= WEEK 7: ADVANCED MARKETPLACE, FAVORITES & DASHBOARDS ================= */
document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);
  const readW7 = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const writeW7 = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const escW7 = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const moneyW7 = value => "PKR " + Number(value || 0).toLocaleString("en-PK");
  const FAV_KEY = "freelancehubWeek7Favorites";
  const seedW7 = [
    {id:"svc-w7-1",title:"I will design a modern mobile app UI in Figma",seller:"Ayesha Khan",role:"UI/UX Designer",category:"UI/UX Design",price:8000,rating:4.9,reviews:84,delivery:5,experience:"Expert",icon:"🎨",popular:98,description:"Clean mobile app screens, reusable components and a clickable prototype.",tags:["Figma","Mobile App","Prototyping"]},
    {id:"svc-w7-2",title:"I will build a responsive business website",seller:"James Anderson",role:"Full-stack Developer",category:"Web Development",price:18000,rating:4.9,reviews:112,delivery:7,experience:"Expert",icon:"💻",popular:96,description:"A fast, responsive website with modern layouts and polished interactions.",tags:["HTML","CSS","JavaScript"]},
    {id:"svc-w7-3",title:"I will create a memorable brand identity",seller:"Noor Hassan",role:"Graphic Designer",category:"Graphic Design",price:6500,rating:5.0,reviews:67,delivery:3,experience:"Intermediate",icon:"🖌️",popular:91,description:"Logo concepts, brand colors and social media design assets.",tags:["Branding","Logo","Adobe Illustrator"]},
    {id:"svc-w7-4",title:"I will develop an Android and iOS mobile app",seller:"Hamza Ali",role:"App Developer",category:"Mobile App Development",price:35000,rating:4.8,reviews:49,delivery:14,experience:"Expert",icon:"📱",popular:87,description:"User-friendly cross-platform mobile app development from idea to launch.",tags:["Flutter","Mobile","Firebase"]},
    {id:"svc-w7-5",title:"I will manage your social media campaigns",seller:"Sara Malik",role:"Digital Marketer",category:"Digital Marketing",price:5500,rating:4.7,reviews:53,delivery:5,experience:"Intermediate",icon:"📈",popular:82,description:"Content planning, campaign setup and performance reporting.",tags:["Social Media","Marketing","Content"]},
    {id:"svc-w7-6",title:"I will write SEO-friendly website content",seller:"Mariam Ahmed",role:"Content Writer",category:"Writing & Translation",price:4000,rating:4.8,reviews:38,delivery:3,experience:"Beginner",icon:"✍️",popular:78,description:"Clear, engaging website copy and blog articles optimized for search.",tags:["SEO","Writing","Blogs"]},
    {id:"svc-w7-7",title:"I will create a powerful data dashboard",seller:"Bilal Raza",role:"Data Analyst",category:"Data Analysis",price:12000,rating:4.9,reviews:41,delivery:7,experience:"Expert",icon:"📊",popular:89,description:"Interactive dashboards, reports and clear data visualizations.",tags:["Excel","Power BI","Analytics"]},
    {id:"svc-w7-8",title:"I will create a clean website UX wireframe",seller:"Ayesha Khan",role:"UI/UX Designer",category:"UI/UX Design",price:5000,rating:4.6,reviews:29,delivery:3,experience:"Intermediate",icon:"🧩",popular:73,description:"User flows, wireframes and practical UX recommendations.",tags:["UX","Wireframes","Figma"]}
  ];
  const favs = () => readW7(FAV_KEY, []);
  const allServices = () => {
    const saved = readW7("freelancehubServices", []);
    const custom = saved.map((s,i)=>({
      id:String(s.id || `custom-${i}`),title:s.title || "Freelance service",seller:(readW7("freelancehubProfile",{}).fullName || "Freelancer"),
      role:(readW7("freelancehubProfile",{}).professionalTitle || "Freelancer"),category:s.category || "Other",
      price:Number(s.price || 0),rating:Number(s.rating || 4.8),reviews:Number(s.reviews || 0),delivery:parseInt(s.delivery,10)||7,
      experience:s.experience || "Intermediate",icon:s.image || "✨",popular:60,description:s.description || "Professional freelance service.",tags:s.tags || []
    }));
    const merged = [...custom, ...seedW7];
    return merged.filter((item,index)=>merged.findIndex(x=>x.id===item.id)===index);
  };
  function serviceCard(item) {
    const saved=favs().includes(item.id);
    return `<article class="week7-service-card"><div class="week7-service-art"><span>${escW7(item.icon)}</span><button type="button" class="favorite-toggle ${saved?"saved":""}" data-favorite="${escW7(item.id)}" aria-label="${saved?"Remove from":"Add to"} favorites" aria-pressed="${saved}">${saved?"♥":"♡"}</button></div><div class="week7-service-body"><div class="week7-card-meta"><span>${escW7(item.category)}</span><span class="week7-rating">★ ${Number(item.rating).toFixed(1)} <small>(${Number(item.reviews)})</small></span></div><h3>${escW7(item.title)}</h3><p class="week7-seller">${escW7(item.seller)} <span>· ${escW7(item.role)}</span></p><p class="week7-description">${escW7(item.description)}</p><div class="week7-tags">${(item.tags||[]).slice(0,3).map(t=>`<span>${escW7(t)}</span>`).join("")}</div><div class="week7-card-footer"><div><small>Starting at</small><strong>${moneyW7(item.price)}</strong></div><span>⏱ ${Number(item.delivery)} days</span></div><a class="btn btn-outline" href="service-details.html">View service</a></div></article>`;
  }
  function bindFavoriteButtons(host, rerender) {
    host.querySelectorAll("[data-favorite]").forEach(btn=>btn.addEventListener("click",()=>{
      const id=btn.dataset.favorite;let current=favs();
      if(current.includes(id)){current=current.filter(x=>x!==id);showToastW7("Removed from favorites.");}
      else{current.push(id);showToastW7("Added to your favorites.");}
      writeW7(FAV_KEY,current);rerender();
    }));
  }
  function showToastW7(message) {
    const el=$("toast");if(!el)return;el.textContent=message;el.classList.add("show");
    clearTimeout(window.__w7ToastTimer);window.__w7ToastTimer=setTimeout(()=>el.classList.remove("show"),2400);
  }

  const marketHost=$("marketResults");
  if(marketHost){
    const params=new URLSearchParams(location.search);
    $("marketSearch").value=params.get("search")||"";
    if(params.get("category"))$("marketCategory").value=params.get("category");
    let firstRender=true;
    function renderMarket(){
      const query=$("marketSearch").value.trim().toLowerCase(),category=$("marketCategory").value;
      const min=Number($("marketMinPrice").value)||0,max=$("marketMaxPrice").value===""?Infinity:Number($("marketMaxPrice").value);
      const rating=Number($("marketRating").value)||0,delivery=Number($("marketDelivery").value)||Infinity,experience=$("marketExperience").value;
      const serviceItems=allServices().filter(x=>{
        const hay=[x.title,x.seller,x.role,x.category,x.description,...(x.tags||[])].join(" ").toLowerCase();
        return (!query||hay.includes(query))&&(!category||x.category===category)&&x.price>=min&&x.price<=max&&x.rating>=rating&&x.delivery<=delivery&&(!experience||x.experience===experience);
      }).map(x=>({...x,kind:"service"}));
      const jobItems=readW7("freelancehubJobs",[]).filter(x=>{
        const hay=[x.title,x.category,x.client,x.description,...(x.skills||[])].join(" ").toLowerCase();
        return (!query||hay.includes(query))&&(!category||x.category===category)&&Number(x.budget||0)>=min&&Number(x.budget||0)<=max&&rating===0&&delivery===Infinity&&!experience;
      }).map(x=>({...x,id:x.id,kind:"job",price:Number(x.budget||0),rating:0,delivery:0,popular:Number(x.proposals||0),seller:x.client||"Client",role:"Client opportunity",icon:"💼",description:x.description||"A client is looking for a skilled freelancer.",reviews:Number(x.proposals||0),tags:x.skills||[]}));
      let list=[...serviceItems,...jobItems];
      const sort=$("marketSort").value;
      if(sort==="price-low")list.sort((a,b)=>a.price-b.price);
      if(sort==="price-high")list.sort((a,b)=>b.price-a.price);
      if(sort==="rating")list.sort((a,b)=>(b.rating||0)-(a.rating||0));
      if(sort==="newest")list.reverse();
      if(sort==="popular")list.sort((a,b)=>(b.popular||0)-(a.popular||0));
      $("marketResultCount").textContent=`${list.length} ${list.length===1?"result":"results"} found · ${serviceItems.length} services · ${jobItems.length} jobs`;
      marketHost.innerHTML=list.length?list.map(item=>{
        if(item.kind==="service")return serviceCard(item);
        return `<article class="week7-service-card week7-job-card"><div class="week7-service-art"><span>💼</span><span class="week7-job-label">Job opportunity</span></div><div class="week7-service-body"><div class="week7-card-meta"><span>${escW7(item.category||"Job")}</span><span>${Number(item.proposals||0)} proposals</span></div><h3>${escW7(item.title)}</h3><p class="week7-seller">${escW7(item.client||"Client")} <span>· Hiring freelancer</span></p><p class="week7-description">${escW7(item.description)}</p><div class="week7-tags">${(item.skills||[]).slice(0,3).map(t=>`<span>${escW7(t)}</span>`).join("")}</div><div class="week7-card-footer"><div><small>Project budget</small><strong>${moneyW7(item.price)}</strong></div><span>Open opportunity</span></div><a class="btn btn-outline" href="job-details.html?id=${encodeURIComponent(item.id)}">View job</a></div></article>`;
      }).join(""):`<div class="week7-empty"><div>⌕</div><h3>No services or jobs found</h3><p>Try changing your search or clearing some filters.</p><button type="button" class="btn btn-primary" id="emptyClearFilters">Clear filters</button></div>`;
      bindFavoriteButtons(marketHost,renderMarket);
      $("emptyClearFilters")?.addEventListener("click",clearFilters);
      firstRender=false;
    }
    function clearFilters(){
      ["marketSearch","marketMinPrice","marketMaxPrice"].forEach(id=>$(id).value="");
      ["marketCategory","marketRating","marketDelivery","marketExperience"].forEach(id=>$(id).selectedIndex=0);
      $("marketSort").value="popular";renderMarket();
    }
    $("marketSearchForm").addEventListener("submit",e=>{e.preventDefault();renderMarket();});
    ["marketSearch","marketMinPrice","marketMaxPrice"].forEach(id=>$(id).addEventListener("input",renderMarket));
    ["marketCategory","marketRating","marketDelivery","marketExperience","marketSort"].forEach(id=>$(id).addEventListener("change",renderMarket));
    $("clearMarketFilters").addEventListener("click",clearFilters);
    document.querySelectorAll("[data-market-search]").forEach(btn=>btn.addEventListener("click",()=>{$("marketSearch").value=btn.dataset.marketSearch;renderMarket();}));
    // Brief loading state before results are rendered.
    marketHost.innerHTML='<div class="week7-loading"><span class="loading-spinner"></span><p>Finding the best services for you...</p></div>';
    setTimeout(renderMarket,180);
  }

  const favoriteHost=$("favoriteResults");
  if(favoriteHost){
    function renderFavorites(){
      const saved=favs(),items=allServices().filter(x=>saved.includes(x.id));
      $("favoriteCount").textContent=`${items.length} saved ${items.length===1?"service":"services"}`;
      favoriteHost.innerHTML=items.length?items.map(serviceCard).join(""):`<div class="week7-empty"><div>♡</div><h3>No favorites saved</h3><p>Save services you like and they’ll appear here.</p><a class="btn btn-primary" href="freelancers.html">Explore services</a></div>`;
      bindFavoriteButtons(favoriteHost,renderFavorites);
    }
    renderFavorites();
  }

  const dashStats=$("dashboardStats");
  if(dashStats){
    const projects=readW7("freelancehubProjects",[]);
    const jobs=readW7("freelancehubJobs",[]);
    const proposals=readW7("freelancehubProposals",[]);
    const services=readW7("freelancehubServices",[]);
    const roleSelect=$("dashboardRole");
    function renderDashboard(){
      const role=roleSelect.value;
      const active=projects.filter(p=>["In Progress","Pending","Submitted"].includes(p.status));
      const completed=projects.filter(p=>p.status==="Completed");
      const totalValue=projects.reduce((sum,p)=>sum+Number(p.budget||0),0);
      if(role==="freelancer"){
        $("dashboardSectionTitle").textContent="Recent orders";
        $("dashboardSectionDesc").textContent="Track your latest client work.";
        $("dashServices").textContent=String(Math.max(services.length,3)).padStart(2,"0");
        $("dashOrders").textContent=String(projects.length).padStart(2,"0");
        $("dashProjects").textContent=String(active.length).padStart(2,"0");
        $("dashValue").textContent=moneyW7(totalValue);
        $("dashboardRecent").innerHTML=projects.length?projects.slice(0,4).map(p=>`<div class="dashboard-row"><span class="dashboard-row-icon">📁</span><div><strong>${escW7(p.title)}</strong><small>${escW7(p.client||"Client")} · ${escW7(p.status)}</small></div><b>${moneyW7(p.budget)}</b></div>`).join(""):`<div class="week7-empty compact"><h3>No active projects</h3><p>Your orders and projects will appear here.</p><a href="freelancers.html" class="text-link">Explore the marketplace →</a></div>`;
      }else{
        $("dashboardSectionTitle").textContent="Client activity";
        $("dashboardSectionDesc").textContent="Manage the jobs and projects you have posted.";
        $("dashServices").textContent=String(jobs.length).padStart(2,"0");
        $("dashOrders").textContent=String(proposals.length).padStart(2,"0");
        $("dashProjects").textContent=String(active.length).padStart(2,"0");
        $("dashValue").textContent=moneyW7(totalValue);
        $("dashboardRecent").innerHTML=jobs.length?jobs.slice(0,4).map(j=>`<div class="dashboard-row"><span class="dashboard-row-icon">📌</span><div><strong>${escW7(j.title)}</strong><small>${escW7(j.category||"Job")} · ${Number(j.proposals||0)} proposals</small></div><b>${moneyW7(j.budget)}</b></div>`).join(""):`<div class="week7-empty compact"><h3>No jobs posted yet</h3><p>Post your first job to start receiving proposals.</p><a href="post-job.html" class="text-link">Post a job →</a></div>`;
      }
    }
    roleSelect.addEventListener("change",renderDashboard);renderDashboard();
  }

  // Add Week 7 navigation shortcuts to the older Week 1–6 pages too.
  const nav=$("navLinks");
  if(nav && !nav.querySelector('[data-week7-nav]')){
    const links=[["freelancers.html","Explore Services"],["favorites.html","Favorites"],["dashboard.html","Dashboard"]];
    links.forEach(([href,label])=>{const a=document.createElement("a");a.href=href;a.textContent=label;a.dataset.week7Nav="true";nav.appendChild(a);});
  }
});


/* MERGED WEEK 5 PROJECT MANAGEMENT LOGIC (single shared JavaScript file) */

document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);
  const KEY = "freelancehubProjects";
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const escapeHTML = v => String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const money = n => "PKR " + Number(n || 0).toLocaleString("en-PK");
  const date = v => v ? new Date(v+"T00:00:00").toLocaleDateString("en-PK",{day:"numeric",month:"short",year:"numeric"}) : "Not set";
  const seed = [
    {id:"project-1001",title:"FreelanceHub Website UI Design",client:"Bright Future Studio",freelancer:"Ayesha Khan",budget:45000,deadline:"2026-11-25",status:"In Progress",progress:65,description:"Design a clean, responsive marketplace experience with clear navigation, reusable components and polished mobile layouts.",tasks:[{title:"Research and references",done:true},{title:"Homepage and dashboard wireframes",done:true},{title:"High-fidelity UI screens",done:true},{title:"Responsive revisions",done:false},{title:"Final handoff and source files",done:false}],deliveries:[]},
    {id:"project-1002",title:"Brand Social Media Kit",client:"Urban Roots",freelancer:"Ayesha Khan",budget:18000,deadline:"2026-11-18",status:"Submitted",progress:100,description:"Create a cohesive social media kit with post templates, story designs and editable source files.",tasks:[{title:"Brand moodboard",done:true},{title:"Post templates",done:true},{title:"Story templates",done:true},{title:"Export and submit files",done:true}],deliveries:[{name:"Social media kit — first delivery",note:"Editable design files and exported previews.",at:"2026-11-10"}]},
    {id:"project-1003",title:"Portfolio Landing Page",client:"Horizon Apps",freelancer:"Ayesha Khan",budget:30000,deadline:"2026-12-02",status:"Pending",progress:0,description:"Build a modern portfolio landing page with project highlights and contact details.",tasks:[{title:"Confirm project requirements",done:false},{title:"Build landing page",done:false},{title:"Testing and delivery",done:false}],deliveries:[]},
    {id:"project-1004",title:"Product Dashboard Prototype",client:"Nova Labs",freelancer:"Ayesha Khan",budget:52000,deadline:"2026-10-30",status:"Completed",progress:100,description:"Create an interactive product dashboard prototype with analytics cards and navigation.",tasks:[{title:"Dashboard layout",done:true},{title:"Charts and components",done:true},{title:"Prototype handoff",done:true}],deliveries:[{name:"Final dashboard prototype",note:"Approved final Figma prototype.",at:"2026-10-28"}]}
  ];
  if (!localStorage.getItem(KEY)) localStorage.setItem(KEY,JSON.stringify(seed));
  let projects = read(KEY,seed), role = "freelancer";
  const save = () => localStorage.setItem(KEY,JSON.stringify(projects));
  const statusClass = s => s.toLowerCase().replace(/\s+/g,"-");
  function card(p){
    return `<article class="project-card"><div class="project-top"><span class="eyebrow">${role==="client"?"Client project":"Freelance order"}</span><span class="status ${statusClass(p.status)}">${escapeHTML(p.status)}</span></div><h2>${escapeHTML(p.title)}</h2><p class="muted">${role==="client"?"Freelancer":"Client"}: ${escapeHTML(role==="client"?p.freelancer:p.client)}</p><div class="project-meta"><span>💰 ${money(p.budget)}</span><span>📅 Due ${date(p.deadline)}</span></div><div class="project-top"><strong>Project progress</strong><strong>${p.progress}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${p.progress}%"></div></div><div class="project-actions"><a class="btn btn-primary" href="project-details.html?id=${encodeURIComponent(p.id)}">View details</a></div></article>`;
  }
  function renderList(){
    if (!$("projectList")) return;
    const q=($("projectSearch").value||"").toLowerCase(), filter=$("statusFilter").value;
    $("statAll").textContent=projects.length;
    $("statActive").textContent=projects.filter(p=>p.status==="In Progress").length;
    $("statSubmitted").textContent=projects.filter(p=>p.status==="Submitted").length;
    $("statCompleted").textContent=projects.filter(p=>p.status==="Completed").length;
    const shown=projects.filter(p=>(filter==="all"||p.status===filter)&&`${p.title} ${p.client} ${p.freelancer}`.toLowerCase().includes(q));
    $("projectList").innerHTML=shown.length?shown.map(card).join(""):`<div class="empty-state" style="grid-column:1/-1"><h3>No projects found</h3><p>Try changing your search or status filter.</p></div>`;
  }
  if ($("projectList")){
    $("projectSearch").addEventListener("input",renderList);$("statusFilter").addEventListener("change",renderList);
    document.querySelectorAll("[data-role]").forEach(btn=>btn.addEventListener("click",()=>{role=btn.dataset.role;document.querySelectorAll("[data-role]").forEach(b=>b.classList.toggle("active",b===btn));renderList();}));
    renderList();
  }
  function renderDetails(){
    const host=$("projectDetails");if(!host)return;
    const id=new URLSearchParams(location.search).get("id"), p=projects.find(x=>x.id===id);
    if(!p){host.innerHTML='<div class="empty-state"><h2>Project not found</h2><p>Return to your orders and choose a project.</p><a class="btn btn-primary" href="orders.html">My Orders</a></div>';return;}
    const done=p.tasks.filter(t=>t.done).length;
    host.innerHTML=`<div class="page-heading"><div><p class="eyebrow">Project workspace · ${escapeHTML(p.id)}</p><h1>${escapeHTML(p.title)}</h1><p class="muted">${escapeHTML(p.description)}</p></div><span class="status ${statusClass(p.status)}">${escapeHTML(p.status)}</span></div>
    <div class="detail-layout"><div><section class="panel detail-section"><h2>Project overview</h2><div class="project-top"><strong>Overall progress</strong><strong id="progressText">${p.progress}%</strong></div><div class="progress-track"><div class="progress-fill" id="progressBar" style="width:${p.progress}%"></div></div><p class="help-text">${done} of ${p.tasks.length} milestones completed</p></section>
    <section class="panel detail-section"><h2>Milestones & tasks</h2><div id="taskList">${p.tasks.map((t,i)=>`<label class="milestone ${t.done?"done":""}"><input type="checkbox" data-task="${i}" ${t.done?"checked":""}><span><strong>${escapeHTML(t.title)}</strong><small>${t.done?"Completed":"Pending"}</small></span></label>`).join("")}</div><form id="taskForm" class="project-toolbar"><input id="newTask" required maxlength="90" placeholder="Add a milestone or task"><button class="btn btn-primary">Add task</button></form></section>
    <section class="panel detail-section"><h2>Delivery & submission</h2><div id="deliveryList">${p.deliveries.length?p.deliveries.map(d=>`<div class="delivery-box" style="margin-bottom:10px"><strong>${escapeHTML(d.name)}</strong><p class="muted">${escapeHTML(d.note)}</p><small>${date(d.at)}</small></div>`).join(""):'<p class="muted">No delivery submitted yet.</p>'}</div><form id="deliveryForm" class="delivery-box"><div class="field"><label for="deliveryName">Delivery title</label><input id="deliveryName" required placeholder="e.g. Final website files"></div><div class="field"><label for="deliveryNote">Submission note</label><textarea id="deliveryNote" rows="3" placeholder="Describe the files or work submitted"></textarea></div><button class="btn btn-primary">Submit delivery</button></form></section></div>
    <aside class="panel detail-side"><div class="detail-section"><h2>Project information</h2><div class="info-row"><span>Client</span><strong>${escapeHTML(p.client)}</strong></div><div class="info-row"><span>Freelancer</span><strong>${escapeHTML(p.freelancer)}</strong></div><div class="info-row"><span>Budget</span><strong>${money(p.budget)}</strong></div><div class="info-row"><span>Deadline</span><strong>${date(p.deadline)}</strong></div><div class="info-row"><span>Tasks</span><strong>${done}/${p.tasks.length}</strong></div></div><div class="detail-section"><h2>Update order status</h2><div class="field"><select id="projectStatus">${["Pending","In Progress","Submitted","Completed","Cancelled"].map(s=>`<option ${p.status===s?"selected":""}>${s}</option>`).join("")}</select></div><button id="saveStatus" class="btn btn-primary" style="width:100%">Save status</button><p class="help-text" style="margin-top:10px">Demo changes are saved in this browser.</p></div></aside></div>`;
    host.querySelectorAll("[data-task]").forEach(input=>input.addEventListener("change",()=>{p.tasks[Number(input.dataset.task)].done=input.checked;p.progress=Math.round(p.tasks.filter(t=>t.done).length/p.tasks.length*100);if(p.progress===100&&p.status==="In Progress")p.status="Submitted";save();renderDetails();}));
    $("taskForm").addEventListener("submit",e=>{e.preventDefault();const title=$("newTask").value.trim();if(title){p.tasks.push({title,done:false});save();renderDetails();}});
    $("deliveryForm").addEventListener("submit",e=>{e.preventDefault();p.deliveries.unshift({name:$("deliveryName").value.trim(),note:$("deliveryNote").value.trim(),at:new Date().toISOString().slice(0,10)});if(p.status==="In Progress")p.status="Submitted";save();renderDetails();});
    $("saveStatus").addEventListener("click",()=>{p.status=$("projectStatus").value;if(p.status==="Completed")p.progress=100;save();renderDetails();});
  }
  renderDetails();
});


/* WEEK 8: final integration, navigation and demo authentication */
document.addEventListener("DOMContentLoaded", () => {
  const authForm = document.getElementById("authForm");
  if (authForm) {
    const tabs = document.querySelectorAll("[data-auth-mode]");
    const heading = document.getElementById("authHeading");
    const submit = document.getElementById("authSubmit");
    const nameField = document.getElementById("authNameField");
    const message = document.getElementById("authMessage");
    let mode = "login";
    tabs.forEach(tab => tab.addEventListener("click", () => {
      mode = tab.dataset.authMode;
      tabs.forEach(t => t.classList.toggle("active", t === tab));
      heading.textContent = mode === "login" ? "Welcome back" : "Create your account";
      submit.textContent = mode === "login" ? "Login" : "Create account";
      nameField.hidden = mode === "login";
      document.getElementById("authName").required = mode === "register";
      message.textContent = "";
    }));
    authForm.addEventListener("submit", event => {
      event.preventDefault();
      if (!authForm.reportValidity()) return;
      const email = document.getElementById("authEmail").value.trim().toLowerCase();
      const password = document.getElementById("authPassword").value;
      const users = (() => { try { return JSON.parse(localStorage.getItem("freelancehubUsers")) || []; } catch { return []; } })();
      if (mode === "register") {
        const name = document.getElementById("authName").value.trim();
        if (name.length < 2 || password.length < 6) {
          message.className = "notice error";
          message.textContent = "Enter your name and use a password with at least 6 characters.";
          return;
        }
        if (users.some(user => user.email === email)) {
          message.className = "notice error";
          message.textContent = "An account with this email already exists. Please login.";
          return;
        }
        users.push({ name, email, password });
        localStorage.setItem("freelancehubUsers", JSON.stringify(users));
        localStorage.setItem("freelancehubSession", JSON.stringify({ name, email }));
        message.className = "notice success";
        message.textContent = "Account created! Redirecting to your dashboard…";
      } else {
        const user = users.find(item => item.email === email && item.password === password);
        if (!user) {
          message.className = "notice error";
          message.textContent = "Email or password is incorrect. Register first if you are new.";
          return;
        }
        localStorage.setItem("freelancehubSession", JSON.stringify({ name: user.name, email: user.email }));
        message.className = "notice success";
        message.textContent = "Login successful! Redirecting to your dashboard…";
      }
      setTimeout(() => location.href = "dashboard.html", 650);
    });
  }
});
