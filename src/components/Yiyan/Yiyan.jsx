import { useState, useEffect } from 'react';

import "./Yiyan.css";


function Yiyan() {
    const [yiyan, setYiyan] = useState("");

    useEffect(() => {
        fetchYiyan();
    }, []);

    const fetchYiyan = async () => {
        try {
            const response = await fetch("https://v1.hitokoto.cn/?encode=text", {
                method: "GET",
            });
            const data = await response.text();
            setYiyan(data);
        } catch (error) {
            console.error("Error fetching yiyan:", error);
        }
    };

    return <span key={yiyan} className='yiyan-text' onClick={fetchYiyan}>{yiyan}</span>
}

export default Yiyan;