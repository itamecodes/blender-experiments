const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduce){const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('enter');observer.unobserve(e.target)}},{threshold:.15});document.querySelectorAll('h1,h2,.intro p,.intro a,.section-heading p,figure,.download-actions>a').forEach(el=>observer.observe(el));}
