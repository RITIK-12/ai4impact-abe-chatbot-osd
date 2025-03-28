import React, {useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

const PageContainer = styled.div`
    position: relative;
    background: linear-gradient(to bottom, #0A2B48, #14558F); 
    width: 100vw;
    height: 100vh;
    box-sizing: border-box;
    padding: 20px 30px;
    font-family: "Open Sans", sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
`;

const Circle = styled.div`
    position: absolute;
    border-radius: 50%;
    z-index: 0;

    &.darkBlue {
        background-color: #0A2B48;
        width: 160vw;
        height: 95vw;
        bottom: -100%;
        left: -93%;
        z-index: 1;
    }

    &.lightBlue {
        background-color: #14558F;
        width: 95vw;
        height: 50vw;
        bottom: -52%;
        right: -44%;
        z-index: 0;
    }
`;

const HeaderBar = styled.div`
    display: flex;
    justify-content: end;
    align-items: center;
    width: 100%;
    position: absolute;
    top: 0;
    right: 0;
    padding: 22px 25px 0 0;
`;

const SkipButton = styled.div`
    color: rgb(240, 240, 240);
    font-size: 14px;
    transition: 0.3s ease-in-out all;
    font-weight: 600;
    animation: ${fadeIn} 0.75s ease-in-out;

    &:hover {
        cursor: pointer;
        color: rgb(160, 160, 160);
    }
`;

const TextContainer = styled.div`
    font-size: 38px;
    font-weight: 700;
    color: rgb(240, 240, 240);
    animation: ${fadeIn} 0.75s ease-in-out;
    z-index: 2;
    text-align: center;
    padding: 0 90px;
    margin-bottom: 5px;
    box-sizing: border-box;
    transition: 0.3s ease-in-out all;
    line-height: 1.6;
`;

const ArrowContainer = styled.span`
    font-size: 38px;
    font-weight: 700;
    color: rgb(240, 240, 240);
    margin-bottom: 0px;
    animation: ${fadeIn} 0.75s ease-in-out;
    z-index: 2;
    text-align: center;
    padding-left: 10px;
    transition: 0.3s ease-in-out all;

    &:hover {
        cursor: pointer;
        color: rgb(160, 160, 160);
    }
`;


const LandingPageStart = () => {
    const navigate = useNavigate();

    const handleButtonClick = () => {
        navigate(`/chatbot/playground/${uuidv4()}`);
    };

    const handleBackButtonClick = () => {
        navigate(`/about`); 
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "ArrowRight") {
                handleButtonClick();
            } else if (event.key === "ArrowLeft") {
                handleBackButtonClick();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return (
        <PageContainer>
            {/* <HeaderBar>
                <SkipButton onClick={handleButtonClick}>Skip to Chat {'>'}</SkipButton>
            </HeaderBar> */}
            <TextContainer>
                The more specific your questions, the better I can help you!
                Ready to get started?
                <ArrowContainer onClick={handleButtonClick}>→</ArrowContainer>
            </TextContainer>
            <Circle className="darkBlue" />
            <Circle className="lightBlue" />
        </PageContainer>
    );
};

export default LandingPageStart;