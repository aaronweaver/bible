export type StoryBlock =
  | { type: 'lede'; text: string }
  | { type: 'p'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'verse'; ref: string; text: string }
  | { type: 'image' }
  | { type: 'attribution'; text: string };

export type Story = {
  id: string;
  title: string;
  author: string;
  church: string;
  publishedRel: string;
  readMinutes: number;
  excerpt: string;
  coverImage: string | null;
  portraitImage?: string | null;
  pullQuote?: string;
  keyVerse?: { ref: string; text: string };
  blocks?: StoryBlock[];
};

export const STORIES: Story[] = [
  {
    id: 'barb-keim',
    title: 'Be Still and Know That I Am God',
    author: 'Barb Keim',
    church: 'Lehigh Valley Baptist Church',
    publishedRel: '2 years ago',
    readMinutes: 5,
    excerpt:
      `For years I attended church, was baptized and confirmed — yet I wondered, "How do I know I'm saved?" Then one question changed everything.`,
    coverImage: 'https://s3.us-east-2.amazonaws.com/lvbc/2023/02/featured-image-lvbc-keim.jpg',
    portraitImage: 'https://s3.us-east-2.amazonaws.com/lvbc/2023/02/image0000004-copy.jpg',
    pullQuote: 'That is when I understood that God wanted to know me.',
    keyVerse: { ref: 'Psalm 46:10', text: 'Be still, and know that I am God.' },
    blocks: [
      { type: 'lede', text: 'My name is Barb, and this is my story.' },
      { type: 'p', text: 'All my life I attended church. I was baptized and confirmed. I enjoyed some of the hymns and would try to read my Bible — but I did not understand what I read. I joined Bible studies, but I was often pre-occupied with other things in my life.' },
      { type: 'p', text: 'One time at work I was speaking to a co-worker about spiritual things. He challenged my thinking about heaven and hell and the destination of a loved one who had passed away. I did not like what he was saying, and after that conversation, we did not talk much.' },
      { type: 'p', text: `Not long after, another co-worker explained that I could be saved if I would "pray to God and confess that I was a sinner and ask Jesus to save me." I attended some Bible studies with her, but nothing really changed. I agreed with the teachings, I tried to be a good person, and I tried to read my Bible — but I wondered, "How do I know I'm saved?"` },
      { type: 'p', text: 'I continued to attend church and was involved in serving, but I was not committed. I would hear from professing Christians about knowing Jesus — I thought because I went to church and prayed a prayer, I knew Jesus. Looking back, I did not understand.' },
      { type: 'p', text: 'For years, I went along like that, thinking I was right with God and living my life — doing things my way. Then, many close relationships in my life began to go wrong, and I became frustrated, angry, and wanted someone to blame. Relationships were something I treasured, and I wanted to be accepted and loved. I wondered where God was.' },
      { type: 'p', text: 'In 2014, I spoke with a woman I know and shared with her the bad things that were happening. She asked me a question: "What is your part in all of this, Barbara?" I was crushed — because in my mind everything was because of someone else, not anything I had done. Then she shared with me Jeremiah 17:9.' },
      { type: 'verse', ref: 'Jeremiah 17:9', text: 'The heart is deceitful above all things, and desperately wicked; who can know it?' },
      { type: 'quote', text: 'That is when I understood that God wanted to know me.' },
      { type: 'p', text: 'With her help, I began to really look at Scripture. I searched for verses on love, and the first I found was Deuteronomy 6:5 — "And thou shalt love the Lord thy God with all thine heart, and with all thy soul, and with all thy might." Reading Scripture and making a few changes seemed to be helping.' },
      { type: 'p', text: 'In September 2014, I began a Bible study at the church I was attending. The focus was the parable of the Prodigal Son from Luke 15. During this study, God showed me where He is and where I was. God is the Creator. I thought on His Word in Psalm 46:10:' },
      { type: 'verse', ref: 'Psalm 46:10', text: 'Be still, and know that I am God.' },
      { type: 'p', text: 'God allowed me to be aware of my smallness and His bigness. I could relate to the prodigal son. I wanted to live my life my way, and I did not want God to be a part of it unless things would be on my terms. But living life my way had left me empty and bitter — the direct result of my sin against God. We were separated because I chose my sin over Him.' },
      { type: 'verse', ref: 'Psalm 51:4', text: 'Against thee, thee only, have I sinned, and done this evil in thy sight…' },
      { type: 'p', text: 'One night, in the fall of 2014, I knelt by my bed and confessed to God that my sin was against Him and Him only. I believed in my heart that Jesus Christ, God\'s only Son, died for my sin and closed the separation between God and me. At that moment, I accepted His gift of salvation.' },
      { type: 'verse', ref: 'Romans 6:23', text: 'The gift of God is eternal life through Jesus Christ our Lord.' },
      { type: 'p', text: 'Through His Word, God has healed my heart and re-ordered my priorities. My Lord is teaching me to be content and to rely on Him.' },
      { type: 'verse', ref: 'Hebrews 13:5', text: 'Let your conversation be without covetousness, and be content with such things as ye have: for he hath said, I will never leave thee, nor forsake thee.' },
      { type: 'p', text: 'God\'s love drew me to Him and to an acceptance of what Christ has done for me. I just needed to "be still, and know that He is God."' },
      { type: 'attribution', text: 'Shared with permission from Lehigh Valley Baptist Church · Changed Lives' },
    ],
  },
  {
    id: 'karen-fowler',
    title: 'Alcohol Was Destroying Me, But Christ Set Me Free',
    author: 'Karen Fowler',
    church: 'Lehigh Valley Baptist Church',
    publishedRel: '2 years ago',
    readMinutes: 4,
    excerpt:
      'For years alcohol was a vital part of my life. After a humiliating moment at Celtic Fest, I knew something had to change — but I never expected it would be everything.',
    coverImage: null,
    pullQuote: 'It was at that moment I knew something had to change; I couldn’t continue to live this way.',
    blocks: [
      { type: 'lede', text: 'My name is Karen, and this is my story.' },
      { type: 'p', text: 'It was just another day, or so I thought. Little did I know my entire life as I knew it was about to change forever.' },
      { type: 'p', text: 'It was that time of year again when the Celtic Fest came to Bethlehem. I loved it — it was a time of enjoying music, food, the Highland games and most of all…beer. I could drink all I wanted and had a “good” reason for it. My daughter, Holly, and her husband, Matt, had come up for the weekend so we could go to Celtic Fest together. Matt and I had left just before noon on Saturday to go down to the Festival, and I began drinking as soon as we got there. We returned home hours later to get everyone else to go back down. I never missed a beat — I just kept on drinking. Later that night, I was so drunk that I did something to royally embarrass myself. Everyone I was with began to laugh at me. They thought it was funny, but I was devastated.' },
      { type: 'quote', text: 'It was at that moment I knew something had to change; I couldn’t continue to live this way.' },
      { type: 'verse', ref: 'Proverbs 23:29–30', text: 'Who hath woe? Who hath sorrow? Who hath contentions? Who hath babbling? Who hath wounds without cause? Who hath redness of eyes? They that tarry long at the wine.' },
      { type: 'p', text: 'When I was young, I had very little religious background or interest. My drinking began at the age of 14 or 15. It seemed only natural — after all, everyone I knew drank — my parents, grandparents, aunts, uncles, and friends. It began slowly at first, but eventually became a vital part of my life.' },
      { type: 'p', text: 'My father died when I was 16 years old. Not long afterwards I was pregnant and married. After I married, alcohol and drugs were still a big part of my life. So were violence, anger, and infidelity. Somehow we managed to stay together for 16 years before we parted ways. During our separation I relied more heavily on alcohol, trying to drown out the pain.' },
      { type: 'p', text: 'One Sunday I went by myself to a Baptist church that was close to home. The message that was preached compelled me to walk down to the altar and pray. I left there thinking I was “saved.” Years later another church baptized me based on that “profession.” But there was no change in my life. I was still heavily involved in alcohol and drugs and my life was a mess.' },
      { type: 'p', text: 'After my humiliating experience at Celtic Fest, I began to wonder if the change I needed was to go back to church. I visited various Baptist churches in the area and enrolled in a Bible study — but something was missing. Then one day a lady mentioned Lehigh Valley Baptist Church. I searched the internet, listened to an audio sermon, and thought to myself, “This is what I’ve been looking for — someone who will teach me what the Word of God has to say!”' },
      { type: 'p', text: 'So I began to visit the church and soon a lady approached me and asked if I would be interested in doing a Bible study with her. As the study progressed, I began to question my previous profession of salvation and asked Robin, “If I was saved at that time, why hasn’t anything changed in my life?”' },
      { type: 'verse', ref: '2 Corinthians 5:17', text: 'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.' },
      { type: 'p', text: 'Robin told me, “Go home and pray about it. The Lord will show you.” That entire week, I prayed that God would show me whether or not I was truly saved. By Sunday I was really burdened, and as I was in the shower getting ready for church, in tears I cried out to God saying, “Lord, I need to know today whether or not I am saved.”' },
      { type: 'p', text: 'That morning the Pastor preached from the book of Hebrews. He kept repeating over and over, “Today is the day of salvation.” As the pastor preached, it was as if no one else was in the church except me. God began to show me my sin, and to show me that I was not saved.' },
      { type: 'verse', ref: 'Jeremiah 29:13', text: 'And ye shall seek me, and find me, when ye shall search for me with all your heart.' },
      { type: 'p', text: 'When the invitation was given at the end of the service, I wanted to jump over the pews to get to the altar. Robin met me there and said, “I knew today would be the day!” That morning, December 8th, 2002, I surrendered my life to the Lord Jesus Christ. I repented of all my sin and put my faith in Jesus and what He had done for me, taking my place on the cross.' },
      { type: 'p', text: 'Everything began to change, from the inside out. It wasn’t a reformation; it was a life-transformation. My drinking — the thing I had struggled with for so many years — stopped. I no longer had a desire for it. In fact, I haven’t touched a drop since that day. Without me even trying, I noticed my foul language changed. I have a love for the Lord and desire to share Christ with everyone I know.' },
      { type: 'verse', ref: 'Romans 5:1', text: 'Therefore being justified by faith, we have peace with God through our Lord Jesus Christ.' },
      { type: 'p', text: 'God often brings us to a very low, helpless point in our life so that we will look up to Him. How about you? Could today be “the day of salvation” for you?' },
      { type: 'attribution', text: 'Shared with permission from Lehigh Valley Baptist Church · Changed Lives' },
    ],
  },
  {
    id: 'david-manohar',
    title: 'I Searched Religions, but Found Salvation in Repentance',
    author: 'David Manohar',
    church: 'Lehigh Valley Baptist Church',
    publishedRel: '1 month ago',
    readMinutes: 5,
    excerpt:
      'I grew up in a church-going family in India and considered myself a good Christian — until the Lord broke me in a Seattle hotel room and everything changed.',
    coverImage: 'https://s3.us-east-2.amazonaws.com/lvbc/2026/03/Manohar-featured-2026.jpg',
    portraitImage: 'https://s3.us-east-2.amazonaws.com/lvbc/2026/03/David-and-Saritha.jpg',
    pullQuote: 'I wanted Him to take full control of my life as Master and Lord.',
    blocks: [
      { type: 'lede', text: 'My name is David, and this is my story.' },
      { type: 'p', text: 'I was born and brought up in India. Though our family was not Hindu, I had many friends who were Hindus and one good friend who was a Muslim. I grew up in a church-going family, went to church regularly and was active in Sunday school and other church activities. I considered myself a good Christian and did not have any concerns about my spiritual condition. Though I went to church regularly, I did not have a clear understanding of the gospel.' },
      { type: 'p', text: 'After I graduated from college in India, I came to the United States for a post-graduate degree in Engineering. While living in Naperville, IL, I started going to an Assembly of God church and heard the gospel for the first time. It was here that I found out that in God’s eyes I was a sinner, having broken the Ten Commandments and not having lived up to God’s perfect standard of righteousness.' },
      { type: 'verse', ref: 'Romans 6:23', text: 'The wages of sin is death…but the gift of God is eternal life through Jesus Christ our Lord.' },
      { type: 'p', text: 'I also found out that being born in a Christian family, going to church regularly or even being baptized as an infant was not going to save me. Trying to be a good person or doing good works is not going to save a person on judgment day either, for Titus 3:5 tells us that we are not saved by works of righteousness which we have done.' },
      { type: 'verse', ref: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
      { type: 'p', text: 'Now it made sense to me. Now I understood that because of my sins I was condemned to hell and that there was nothing I could do to be forgiven on my own. Hebrews 9:22 tells us that “without shedding of blood is no remission of sins.” The only way my sins could be paid for was for Jesus to die on the cross. I realized that I needed to personally believe in Him and ask Him to be my Savior. So I responded to an altar call at church, knelt at the altar, and prayed — and got up assuming I must be saved.' },
      { type: 'p', text: 'When I moved to Pennsylvania, I tried out many different churches — Wesleyan, United Church of Christ, Baptist, and a Brethren Assembly. I noticed that many professing “believers” did not have a life that backed up their profession. I was never challenged about my own profession and found that if I simply claimed to be saved, everyone accepted it.' },
      { type: 'p', text: 'In 2001, the Lord brought me to a very low point in my life. I was facing crises in both my personal and professional life. On a weekend trip to Seattle, I had a lot of time to think and evaluate my condition. God broke me right then and there, and I fell on my knees and cried out to God in full surrender.' },
      { type: 'quote', text: 'I wanted Him to take full control of my life as Master and Lord.' },
      { type: 'p', text: 'From that point on my life began to change dramatically. I had a hunger for God’s Word and a desire to fellowship with other believers. I wanted to be baptized in obedience to the Lord’s command. I had a genuine burden for lost family members and friends to be saved. I found that obeying God’s commands was not “grievous” (1 John 5:3).' },
      { type: 'p', text: 'The Lord led me to Lehigh Valley Baptist Church in Emmaus, Pennsylvania. There the Lord began to show me through the preaching and my own personal Bible study that salvation was more than mentally agreeing to facts. A true conversion involves repentance of sin and faith in Christ and results in a changed life. I came to the conclusion that I had only made an empty profession while in Naperville, but had been truly converted by God’s work in my life when I surrendered to Him in Seattle.' },
      { type: 'verse', ref: '2 Corinthians 5:17', text: 'If any man be in Christ, he is a new creature, old things are passed away; behold, all things are become new.' },
      { type: 'verse', ref: '2 Corinthians 13:5', text: 'Examine yourselves whether ye be in the faith.' },
      { type: 'p', text: 'Do not be satisfied with a profession of salvation if it did not include repentance of sin or did not result in a changed life.' },
      { type: 'attribution', text: 'Shared with permission from Lehigh Valley Baptist Church · Changed Lives' },
    ],
  },
  {
    id: 'denise-rogers',
    title: 'God Has Thoughts of Peace towards You',
    author: 'Denise Rogers',
    church: 'Lehigh Valley Baptist Church',
    publishedRel: '3 weeks ago',
    readMinutes: 6,
    excerpt:
      'I had tried to be born again for twenty years — going to altars, asking forgiveness, feeling guilty. It took a broken heart and Jeremiah 29 before I understood what I’d been missing.',
    coverImage: 'https://s3.us-east-2.amazonaws.com/lvbc/2026/04/denise-featured-2026.jpg',
    portraitImage: 'https://s3.us-east-2.amazonaws.com/lvbc/2026/04/14f03fc76a1c8ffe63c20ee6afa87652.jpg',
    pullQuote: 'God didn’t want to punish me. He had thoughts of peace toward me!',
    blocks: [
      { type: 'lede', text: 'Peace and acceptance is something our society always seems to be looking for — and I was no exception.' },
      { type: 'p', text: 'I grew up in a home where alcohol and fighting were common; consequently, it was a place where I did not want to be. By the time I was in my teens and early twenties, I found myself absorbed in living “life to the fullest” and searching for someone to love and accept me. All this did, though, was make me miserable. Each day brought more emptiness; yet I would still pursue the same meaningless path. Living life this way acquainted me with many consequences…failure in school, jail sentences, drug overdoses, drunk-driving accidents, even death. But God loved me even then, and His hand was upon me because He protected me from many foolish and dangerous situations.' },
      { type: 'p', text: 'After graduating from high school, I got a job at an insurance company. There was a girl who also worked there who was “religious.” She told me of Jesus — that God loved me and sent His only Son to die for me (John 3:16), even though I was a sinner. Oh, this was what I longed for — to be set free from the very unhappy, sinful life I was living! She bought me a Bible and I began to read for myself the things she told me. I believed all that the Bible said and tried to become one of those “born-again” Christians. I tried and tried and tried…it seemed the only thing that had changed was my mind.' },
      { type: 'p', text: 'In 1985 I got married and my husband and I began our family. Things were more settled down, yet something still seemed to be missing. In 1999, we started going to Lehigh Valley Baptist Church, and it was there that things started to come into light. I was hearing messages I had never heard before. I started to question the authenticity of my own relationship with God. Could it be that I had been living the last 20 years “imagining” I had a relationship with God?' },
      { type: 'p', text: 'I could not remember any time at all where I had specifically repented of my sin — turned away from pursuing a life of sinful desires, from living for myself. I remembered the countless times I had gone to an altar, asking God to forgive me. And I also remembered that thought that went right alongside: “I don’t totally want to give this up, to totally surrender my life to God…because I know I’m just going to go back to it.” Why did I never have the victory that the Bible and others spoke of?' },
      { type: 'quote', text: 'I was missing true, biblical repentance.' },
      { type: 'p', text: 'Sure, I was sorry for sins I committed, but the kind of repentance that mattered to God was not there. I had never come to Him like the repentant thief on the cross, or like the publican in the temple.' },
      { type: 'verse', ref: 'Luke 18:13', text: 'The publican, standing afar off, would not lift up so much as his eyes unto heaven, but smote upon his breast, saying, God be merciful to me a sinner.' },
      { type: 'p', text: 'I knew I believed in God, that I was a sinner, and that every word of the Bible was true…but it wasn’t enough that I believed just these facts, for the Bible says, “The devils also believe, and tremble” (James 2:19). I could not rest in my clean outside appearance because it was the inside that God was concerned with.' },
      { type: 'verse', ref: 'Jeremiah 17:9–10', text: 'The heart is deceitful above all things, and desperately wicked: who can know it? I the LORD search the heart, I try the reins, even to give every man according to his ways, and according to the fruit of his doings.' },
      { type: 'p', text: 'God truly had my attention. I prayed like I had never prayed before in the days that followed because I knew I was in BIG TROUBLE WITH GOD! Then I read something in the Bible that broke my heart.' },
      { type: 'verse', ref: 'Jeremiah 29:11–14', text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end. Then shall ye call upon me, and ye shall go and pray unto me, and I will hearken unto you. And ye shall seek me, and find me, when ye shall search for me with all your heart.' },
      { type: 'p', text: 'God had thoughts of peace toward me, even after all I had done against Him! As I was earnestly seeking Him, He was searching my heart and showing me how hypocritical and self-righteous I was. He didn’t show me this to be unkind, but because He truly loved me and wanted to forgive my sin and be my Heavenly Father. He will not force anyone to love Him — I had to make a choice.' },
      { type: 'quote', text: 'God didn’t want to punish me. He had thoughts of peace toward me!' },
      { type: 'p', text: 'It was reckoning time. On April 10, 2000, I bowed my head and confessed to God my wicked self-righteousness, repented of ALL my sins, and asked Him to save me. And He did! My life has not been the same since. I would never, ever want to go back to that old life of being bound in obvious sin, or — just as bad — being a religious hypocrite.' },
      { type: 'p', text: 'How I thank God for His blessed mercy and patience toward me, and for His unspeakable gift of salvation! While each of our lives is different, He loves every one of us with an everlasting love (Jeremiah 31:3). Please take the time to consider how God is working in yours and the thoughts He has toward you.' },
      { type: 'verse', ref: '2 Peter 3:9', text: 'The Lord is…not willing that any should perish, but that all should come to repentance.' },
      { type: 'attribution', text: 'Shared with permission from Lehigh Valley Baptist Church · Changed Lives' },
    ],
  },
];
