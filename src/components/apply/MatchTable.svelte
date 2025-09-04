<script lang="ts">
	import { InformationCircleIcon, XCircleIcon } from '@rgossiaux/svelte-heroicons/outline';
    import { fly } from 'svelte/transition';
    import ToolTip from '@/components/global/ToolTip.svelte';
    import MatchCard from "./MatchCard.svelte";
    import { options } from "./options";
    import {createEventDispatcher, onMount} from 'svelte';
    const dispatch = createEventDispatcher();

    let matchAble = false;

    function handleSelect(){
        matchAble = false;
        options.forEach(option => {
            option.options.forEach(item => {
                if(item.selected){
                    matchAble = true;
                    return;
                }
            });
        });
    }

    onMount(()=>{
        handleSelect()
    })

    function match(){
        // if(matchAble === false){
        //     return;
        // }
        let selectedIndices: number[][] = [];
        options.forEach((option, groupIndex) => {
            let indices: number[] = [];
            option.options.forEach((item, index) => {
                if(item.selected){
                    indices.push(index);
                }
            });
            selectedIndices.push(indices);
        });
        // 生成个性标签
        let codeString = selectedIndices.map((indices, idx) => `${idx}:${indices.join(',')}`).join(';');
        let encodedCode = btoa(codeString);
        console.log('Generated code:', encodedCode);
        dispatch('match', {code: encodedCode});
    }
</script>

<div class="match-table" transition:fly={{ duration: 300}}>
    <div class="flex justify-between items-center w-full">
        <div class="flex items-center gap-1" style="width: 200px;">
            <!-- <ToolTip position="bottom">
            </ToolTip>
            <div class="transition duration-100 ease-linear">契合度匹配</div> -->
        </div>
        <div class="flex items-center gap-1">
            <ToolTip text="我们会根据你选择的结果，调整面试官优先级" position="left">
                <InformationCircleIcon class="w-5 h-5 cursor-pointer hover:text-blue-500 transition duration-300 ease-linear" />
            </ToolTip>
            <div style="color: #4E5969">
                请选择你的技术方向 - 兴趣爱好 - 未来道路
            </div>
        </div>
        <div style="width: 200px;">
        </div>
<!--    <ToolTip text="关闭窗口" position="left">-->
<!--        <div class="flex gap-2 close-icon rounded-[20px]" on:click={()=>dispatch('closeMatchTable',{})}>-->
<!--            <XCircleIcon class="w-5 h-5" />-->
<!--        </div>-->
<!--    </ToolTip>-->
</div>
<div class="card-area">
    {#each options as option,index}
        <div class="option-group">
            <h3 class="group-title">{option.title}</h3>
            <MatchCard on:itemSelect={handleSelect} options={option.options}></MatchCard>
        </div>
    {/each}
</div>
<div class="button-group">
    <div class="finish-button" on:click={match}>生成个性标签</div>
</div>
</div>

<style lang="scss">
    .match-table{
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        background-color: white;
        top:56px;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10;
        padding: 0 30px;
        overflow: auto;
    }
    .close-icon{
        cursor: pointer;
        transition: all ease-in-out 0.3s;

        &:hover{
            color: #60a5fa;
            rotate: 180deg;
        }
    }
    .button-group{
        display: flex;
        justify-content: center;
        width: 100%;
        gap:4px;
        margin-top: 20px;
    }
    .finish-button{
      margin-bottom: 20px;
      width: 150px;
      height: 40px;
      border-radius: 5px;
      background-color: white;
      color: #165DFF;
      border: 1px solid #165DFF;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: all ease-in-out 0.2s;

      &:hover{
        background-color: #165DFF;
        color: white;
      }
    }

  @media screen and (max-width: 768px) {
    .finish-button{
      margin-bottom: 70px;
    }
    .match-table{
      overflow: auto;
      position: fixed;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      height: 100%;
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 0 60px 1px rgba(0, 0, 0, 0.4);
      padding: 20px;
    }

    .close-icon:hover{
        transition: none;
    }
  }

  .option-group {
    margin-bottom: 20px;
  }

  .group-title {
    text-align: center;
    color: #4E5969;
    font-size: 18px;
    margin-bottom: 10px;
  }
</style>
