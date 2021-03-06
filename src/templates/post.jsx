import 'rc-pagination/dist/rc-pagination.min.css';

import AuthorImage from "../components/AuthorImage/AuthorImage";
import AuthorInfo from "../components/AuthorInfo/AuthorInfo";
import AuthorModel from "../models/author-model";
import BlogLogo from "../components/BlogLogo/BlogLogo";
import Disqus from "../components/Disqus/Disqus";
import Drawer from "../layouts/Drawer/Drawer";
import Footer from "../components/Footer/Footer";
import GhostSubscribe from "../components/GhostSubscribe/GhostSubscribe";
import Helmet from "react-helmet";
import MainContent from "../layouts/MainContent/MainContent";
import MainHeader from "../layouts/MainHeader/MainHeader";
import MainNav from "../layouts/MainNav/MainNav";
import MenuButton from "../components/MenuButton/MenuButton";
import Navigation from "../components/Navigation/Navigation";
import Pagination from 'rc-pagination';
import PostDate from "../components/PostDate/PostDate";
import PostFooter from "../layouts/PostFooter/PostFooter";
import PostFormatting from "../layouts/PostFormatting/PostFormatting";
import PostHeader from "../layouts/PostHeader/PostHeader";
import PostShare from "../components/PostShare/PostShare";
import PostTags from "../components/PostTags/PostTags";
import React from "react";
import ReactMarkdown from 'react-markdown';
import ReadNext from "../components/ReadNext/ReadNext";
import SEO from "../components/SEO/SEO";
import SiteWrapper from "../layouts/SiteWrapper/SiteWrapper";
import config from "../../data/SiteConfig";

function parsePost(post, slug) {
  const result = post;
  if (!result.id) {
    result.id = slug;
  }
  if (!result.id) {
    result.category_id = config.postDefaultCategoryID;
  }
  return result;
}

const formatReadNext = value => ({
  path: value.fields.slug,
  title: value.frontmatter.title,
  cover: value.frontmatter.cover,
  excerpt: value.excerpt
});

const getURLParams = () => {
  let paramsStr = '' 
  if (process.browser) { 
    paramsStr = location.search.slice(1);
  }
  const paramsArr = paramsStr.split('&');
  const paramsObj = {};
  paramsArr.forEach((param) => { paramsObj[param.split('=')[0]] = param.split('=')[1]; });
  return paramsObj;
}

const linesPerPage = () => {
  const paramsObj = getURLParams();
  return (paramsObj.l ? parseInt(paramsObj.l, 10) : 10);
}

class PostTemplate extends React.Component {
  state = {
    menuOpen: false,
    linesPerPage: linesPerPage(),
    curPage: 1
  };

  handleOnClick = evt => {
    evt.stopPropagation();
    if (this.state.menuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  };

  handleOnClose = evt => {
    evt.stopPropagation();
    this.closeMenu();
  };

  openMenu = () => {
    this.setState({ menuOpen: true });
  };

  closeMenu = () => {
    this.setState({ menuOpen: false });
  };

  handlePageChange = (current) => {
    this.setState({ curPage: current });
    setTimeout(() => {
      window.scroll({ top: document.getElementById('content').offsetTop, left: 0, behavior: 'smooth' });
    }, 200);
  };

  clearMD = rawMD => rawMD.replace(/-{3}\n(.+\n)*-{3}\n/gmi, '');

  linesArr = md => md.split('\n\n');

  curPageLines = md => this.linesArr(md).slice((this.state.curPage - 1) * this.state.linesPerPage, this.state.curPage * this.state.linesPerPage);

  renderHTML = obj => <div dangerouslySetInnerHTML={{__html: obj.value}} />;

  renderHeader = (cover) => {
    if(!cover) return null;
    return (<MainHeader className="post-head" cover={cover}>
      <MainNav>
        <BlogLogo logo={config.siteLogo} title={config.siteTitle} />
        <MenuButton navigation={config.siteNavigation} onClick={this.handleOnClick} />
      </MainNav>
    </MainHeader>);
  }
  

  render() {
    const { location, data } = this.props;
    const { slug, next, prev } = this.props.pathContext;
    const postNode = this.props.data.markdownRemark;
    const rawMD = postNode.internal.content;
    const post = parsePost(postNode.frontmatter, slug);
    const { cover, title, date, author, tags } = post;
    const className = post.post_class ? post.post_class : "post";
    const totalLines = this.linesArr(this.clearMD(rawMD)).length;
    const authorData = AuthorModel.getAuthor(
      this.props.data.authors.edges,
      author,
      config.blogAuthorId
    );
    const getNextData = () => (next ? formatReadNext(data.next) : null);
    const getPrevData = () => (prev ? formatReadNext(data.prev) : null);
    return (
      <Drawer className="post-template" isOpen={this.state.menuOpen}>
        <Helmet>
          <title>{`${post.title} | ${config.siteTitle}`}</title>
        </Helmet>
        <SEO postPath={slug} postNode={postNode} postSEO />

        {/* The blog navigation links */}
        <Navigation config={config} onClose={this.handleOnClose} />

        <SiteWrapper>
          {this.renderHeader(cover)}
          <MainContent>
            <PostFormatting className={className}>
              <PostHeader>
                <h1 className="post-title">{title}</h1>
                <section className="post-meta">
                  <PostDate date={date} />
                  <PostTags prefix=" on " tags={tags} />
                </section>
              </PostHeader>

              <section className="post-content">
                <ReactMarkdown source={this.curPageLines(this.clearMD(rawMD)).join('\n\n')} renderers={{html: this.renderHTML}} />
              </section>
              <div className="post-pagination">
                <Pagination
                  current={this.state.curPage}
                  pageSize={this.state.linesPerPage}
                  total={totalLines}
                  hideOnSinglePage
                  onChange={this.handlePageChange}
                />
              </div>

              <PostFooter>
                <AuthorImage author={authorData} />
                <AuthorInfo prefix="/author" author={authorData} />
                <PostShare
                  postNode={postNode}
                  postPath={location.pathname}
                  config={config}
                />
                <GhostSubscribe />
                <Disqus postNode={postNode} />
              </PostFooter>
            </PostFormatting>
          </MainContent>
          <ReadNext next={getNextData()} prev={getPrevData()} />

          {/* The tiny footer at the very bottom */}
          <Footer
            copyright={config.copyright}
            promoteGatsby={config.promoteGatsby}
          />
        </SiteWrapper>
      </Drawer>
    );
  }
}

/* eslint no-undef: "off" */
export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!, $next: String, $prev: String) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      internal {
        content
      }
      timeToRead
      excerpt
      frontmatter {
        title
        cover
        date
        category
        tags
        author
      }
      fields {
        slug
      }
    }
    # prev post data
    prev: markdownRemark(fields: { slug: { eq: $prev } }) {
      excerpt(pruneLength: 112)
      frontmatter {
        title
        cover
        date
      }
      fields {
        slug
      }
    }
    # next post data
    next: markdownRemark(fields: { slug: { eq: $next } }) {
      excerpt(pruneLength: 112)
      frontmatter {
        title
        cover
        date
      }
      fields {
        slug
      }
    }
    # authors
    authors: allAuthorsJson {
      edges {
        node {
          id
          name
          image
          url
          bio
        }
      }
    }
  }
`;

export default PostTemplate;
